import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ changeId: string }> }
) {
  try {
    const session = await requireAuth()

    const { changeId } = await params

    const db = createClient()

    // Get the change record to verify it exists
    const changeResult = await db.execute(
      `SELECT id, change_type, old_email, old_name, new_email, new_name
       FROM donor_changes
       WHERE id = ?`,
      [changeId]
    )

    if (!changeResult.rows || changeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Change record not found' }, { status: 404 })
    }

    const change = changeResult.rows[0] as {
      id: number
      change_type: string
      old_email: string | null
      old_name: string | null
      new_email: string | null
      new_name: string | null
    }

    // Delete the change record
    const deleteResult = await db.execute(
      `DELETE FROM donor_changes WHERE id = ?`,
      [changeId]
    )

    const rowsAffected = (deleteResult as any).rowsAffected || 0

    if (rowsAffected === 0) {
      return NextResponse.json({
        error: 'Failed to delete change record'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted_change_id: parseInt(changeId),
      change_type: change.change_type,
      old_email: change.old_email,
      old_name: change.old_name,
      new_email: change.new_email,
      new_name: change.new_name,
      message: 'Change record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting donor change record:', error)
    return NextResponse.json({
      error: 'Failed to delete change record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
