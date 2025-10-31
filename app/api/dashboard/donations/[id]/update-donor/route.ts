import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

// Helper function to ensure donor_changes table exists
async function ensureDonorChangesTable(db: any) {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS donor_changes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        old_email VARCHAR(255),
        old_name VARCHAR(255),
        new_email VARCHAR(255),
        new_name VARCHAR(255),
        change_type ENUM('update', 'merge', 'split', 'transaction_update') NOT NULL DEFAULT 'update',
        affected_transaction_count INT DEFAULT 0,
        changed_by VARCHAR(255),
        admin_email VARCHAR(255),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reverted_at TIMESTAMP NULL,
        is_reverted BOOLEAN DEFAULT FALSE,
        organization_id INT,
        notes TEXT,
        INDEX idx_old_email (old_email),
        INDEX idx_new_email (new_email),
        INDEX idx_changed_at (changed_at),
        INDEX idx_organization (organization_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  } catch (error) {
    console.error('Failed to create donor_changes table:', error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()

    const { id } = await params
    const { donor_email, donor_name, notes } = await request.json()

    if (!donor_email && !donor_name) {
      return NextResponse.json({
        error: 'At least one of donor_email or donor_name must be provided'
      }, { status: 400 })
    }

    const db = createClient()

    // First, get the current transaction to record the old values
    const transactionResult = await db.execute(
      'SELECT donor_email, donor_name, organization_id FROM donations WHERE id = ?',
      [id]
    )

    if (!transactionResult.rows || transactionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const oldTransaction = transactionResult.rows[0] as {
      donor_email: string | null
      donor_name: string | null
      organization_id: number
    }

    // Update the transaction
    await db.execute(
      `UPDATE donations
       SET donor_email = ?, donor_name = ?, updated_at = NOW()
       WHERE id = ?`,
      [donor_email || null, donor_name || null, id]
    )

    // Record the change in donor_changes table
    try {
      await db.execute(
        `INSERT INTO donor_changes (
          old_email, old_name, new_email, new_name,
          change_type, affected_transaction_count,
          changed_by, admin_email, organization_id, notes
        ) VALUES (?, ?, ?, ?, 'transaction_update', 1, ?, ?, ?, ?)`,
        [
          oldTransaction.donor_email,
          oldTransaction.donor_name,
          donor_email || null,
          donor_name || null,
          session.merchant_name || session.email || 'Admin',
          session.email,
          oldTransaction.organization_id,
          notes || `Transaction ${id} donor info updated`
        ]
      )
    } catch (historyError: any) {
      // If table doesn't exist, create it and retry
      if (historyError?.message?.includes("doesn't exist") || historyError?.message?.includes("Table")) {
        console.log('donor_changes table not found, creating it...')
        await ensureDonorChangesTable(db)

        // Retry the insert
        try {
          await db.execute(
            `INSERT INTO donor_changes (
              old_email, old_name, new_email, new_name,
              change_type, affected_transaction_count,
              changed_by, admin_email, organization_id, notes
            ) VALUES (?, ?, ?, ?, 'transaction_update', 1, ?, ?, ?, ?)`,
            [
              oldTransaction.donor_email,
              oldTransaction.donor_name,
              donor_email || null,
              donor_name || null,
              session.merchant_name || session.email || 'Admin',
              session.email,
              oldTransaction.organization_id,
              notes || `Transaction ${id} donor info updated`
            ]
          )
        } catch (retryError) {
          console.error('Failed to record donor change history after creating table:', retryError)
        }
      } else {
        console.error('Failed to record donor change history:', historyError)
      }
      // Continue even if history recording fails
    }

    // Fetch and return the updated transaction
    const updatedResult = await db.execute(
      'SELECT * FROM donations WHERE id = ?',
      [id]
    )

    return NextResponse.json({
      success: true,
      transaction: updatedResult.rows[0],
      message: 'Transaction donor information updated successfully'
    })
  } catch (error) {
    console.error('Error updating transaction donor info:', error)
    return NextResponse.json({
      error: 'Failed to update transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
