import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await requireAuth()

    const { email: encodedEmail } = await params
    const email = decodeURIComponent(encodedEmail)

    const db = createClient()

    // Handle both regular email donors and anonymous donors
    const isAnonymous = email.startsWith('name_without_email_')

    let whereClause: string
    let queryParams: any[]

    if (isAnonymous) {
      const name = email.replace('name_without_email_', '')
      // Get changes where either old or new values match the anonymous donor
      whereClause = `(old_email IS NULL AND LOWER(old_name) = LOWER(?))
                     OR (new_email IS NULL AND LOWER(new_name) = LOWER(?))`
      queryParams = [name, name]
    } else {
      // Get changes where either old or new email matches
      whereClause = `LOWER(old_email) = LOWER(?) OR LOWER(new_email) = LOWER(?)`
      queryParams = [email, email]
    }

    // Fetch change history
    const historyResult = await db.execute(
      `SELECT
        id,
        old_email,
        old_name,
        new_email,
        new_name,
        change_type,
        affected_transaction_count,
        changed_by,
        admin_email,
        changed_at,
        reverted_at,
        is_reverted,
        notes
       FROM donor_changes
       WHERE ${whereClause}
       ORDER BY changed_at DESC`,
      queryParams
    )

    return NextResponse.json({
      success: true,
      history: historyResult.rows || [],
      count: historyResult.rows?.length || 0
    })
  } catch (error) {
    console.error('Error fetching donor history:', error)

    // If table doesn't exist, return empty history
    if (error instanceof Error && error.message.includes("doesn't exist")) {
      return NextResponse.json({
        success: true,
        history: [],
        count: 0,
        message: 'Donor changes table not yet initialized'
      })
    }

    return NextResponse.json({
      error: 'Failed to fetch donor history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
