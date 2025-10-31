import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

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
    } catch (historyError) {
      console.error('Failed to record donor change history:', historyError)
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
