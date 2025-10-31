import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> }
) {
  try {
    const session = await requireAuth()

    const { changeId } = await params
    const { notes } = await request.json()

    const db = createClient()

    // Get the change record
    const changeResult = await db.execute(
      `SELECT * FROM donor_changes WHERE id = ?`,
      [changeId]
    )

    if (!changeResult.rows || changeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Change record not found' }, { status: 404 })
    }

    const change = changeResult.rows[0] as {
      id: number
      old_email: string | null
      old_name: string | null
      new_email: string | null
      new_name: string | null
      change_type: string
      is_reverted: boolean
      organization_id: number
      changed_at: string
    }

    if (change.is_reverted) {
      return NextResponse.json({
        error: 'This change has already been reverted'
      }, { status: 400 })
    }

    // Revert the changes by updating transactions back to old values
    let affectedCount = 0

    if (change.change_type === 'transaction_update') {
      // For single transaction updates, we need to find and update that specific transaction
      // Since we don't store transaction IDs in donor_changes, we need to find transactions
      // that match the new values and were updated around the same time
      const updateResult = await db.execute(
        `UPDATE donations
         SET donor_email = ?, donor_name = ?, updated_at = NOW()
         WHERE donor_email <=> ? AND donor_name <=> ?
         AND updated_at >= DATE_SUB(?, INTERVAL 1 MINUTE)
         LIMIT 1`,
        [
          change.old_email,
          change.old_name,
          change.new_email,
          change.new_name,
          change.changed_at
        ]
      )
      affectedCount = (updateResult as any).rowsAffected || 0
    } else {
      // For bulk updates, revert all matching transactions
      let whereClause: string
      let queryParams: any[]

      if (change.new_email === null) {
        // Anonymous donor - match by name
        whereClause = 'donor_email IS NULL AND LOWER(donor_name) = LOWER(?)'
        queryParams = [change.new_name]
      } else {
        // Regular donor - match by email
        whereClause = 'LOWER(donor_email) = LOWER(?)'
        queryParams = [change.new_email]
      }

      const updateResult = await db.execute(
        `UPDATE donations
         SET donor_email = ?, donor_name = ?, updated_at = NOW()
         WHERE ${whereClause}`,
        [change.old_email, change.old_name, ...queryParams]
      )

      affectedCount = (updateResult as any).rowsAffected || 0
    }

    // Mark the change as reverted
    await db.execute(
      `UPDATE donor_changes
       SET is_reverted = TRUE, reverted_at = NOW()
       WHERE id = ?`,
      [changeId]
    )

    // Create a new change record for the revert action
    try {
      await db.execute(
        `INSERT INTO donor_changes (
          old_email, old_name, new_email, new_name,
          change_type, affected_transaction_count,
          changed_by, admin_email, organization_id, notes
        ) VALUES (?, ?, ?, ?, 'update', ?, ?, ?, ?, ?)`,
        [
          change.new_email,
          change.new_name,
          change.old_email,
          change.old_name,
          affectedCount,
          session.merchant_name || session.email || 'Admin',
          session.email,
          change.organization_id,
          notes || `Reverted change #${changeId}`
        ]
      )
    } catch (historyError) {
      console.error('Failed to record revert in history:', historyError)
    }

    return NextResponse.json({
      success: true,
      reverted_change_id: changeId,
      affected_count: affectedCount,
      old_email: change.new_email,
      old_name: change.new_name,
      new_email: change.old_email,
      new_name: change.old_name,
      message: `Successfully reverted change and updated ${affectedCount} transaction(s)`
    })
  } catch (error) {
    console.error('Error reverting donor change:', error)
    return NextResponse.json({
      error: 'Failed to revert change',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
