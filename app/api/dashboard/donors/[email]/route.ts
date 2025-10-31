// app/api/dashboard/donors/[email]/route.ts
// Get individual donor details and donation history by email

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const { email } = await params
    const donorIdentifier = decodeURIComponent(email)
    const db = createClient()

    // Check if this is an anonymous donor identifier (format: "name_without_email_<name>")
    // or a regular email address
    let whereClause: string
    let queryParams: any[]

    if (donorIdentifier.startsWith('name_without_email_')) {
      // Extract the name from the identifier
      const donorName = donorIdentifier.replace('name_without_email_', '')
      whereClause = 'AND d.donor_email IS NULL AND d.donor_name = ?'
      queryParams = [merchant_id, donorName]
    } else {
      // Regular email lookup
      whereClause = 'AND d.donor_email = ?'
      queryParams = [merchant_id, donorIdentifier]
    }

    // Get donor summary statistics across all merchant organizations
    // For email lookups: aggregate ALL donations for that email regardless of name
    // For name-only lookups: keep grouping by name
    const groupByClause = donorIdentifier.startsWith('name_without_email_')
      ? 'GROUP BY d.donor_email, d.donor_name'
      : 'GROUP BY d.donor_email'

    const statsResult = await db.execute(
      `SELECT
        d.donor_email,
        COALESCE(
          MAX(CASE WHEN d.donor_name IS NOT NULL AND d.donor_name != '' THEN d.donor_name END),
          'Anonymous Donor'
        ) as donor_name,
        COUNT(d.id) as donation_count,
        SUM(d.amount) as total_donated,
        AVG(d.amount) as average_donation,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation,
        SUM(CASE WHEN d.receipt_sent = 1 THEN 1 ELSE 0 END) as receipts_sent,
        SUM(CASE WHEN d.is_recurring = 1 THEN 1 ELSE 0 END) as recurring_donations
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        ${whereClause}
        AND d.payment_status = 'COMPLETED'
      ${groupByClause}`,
      queryParams
    )

    if (statsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 })
    }

    const donorStats = statsResult.rows[0]

    // Get donation history across all merchant organizations
    const historyResult = await db.execute(
      `SELECT
        d.id,
        d.amount,
        d.currency,
        d.payment_id,
        d.square_order_id,
        d.is_recurring,
        d.is_custom_amount,
        d.donation_type,
        d.receipt_sent,
        d.created_at
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        ${whereClause}
        AND d.payment_status = 'COMPLETED'
      ORDER BY d.created_at DESC
      LIMIT 50`,
      queryParams
    )

    const donationHistory = historyResult.rows.map((row: any) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      payment_id: row.payment_id,
      square_order_id: row.square_order_id,
      is_recurring: Boolean(row.is_recurring),
      is_custom_amount: Boolean(row.is_custom_amount),
      donation_type: row.donation_type,
      receipt_sent: Boolean(row.receipt_sent),
      created_at: row.created_at,
    }))

    return NextResponse.json({
      donor: {
        email: donorStats.donor_email,
        name: donorStats.donor_name,
        donation_count: parseInt(donorStats.donation_count),
        total_donated: parseFloat(donorStats.total_donated).toFixed(2),
        average_donation: parseFloat(donorStats.average_donation).toFixed(2),
        first_donation: donorStats.first_donation,
        last_donation: donorStats.last_donation,
        receipts_sent: parseInt(donorStats.receipts_sent),
        recurring_donations: parseInt(donorStats.recurring_donations),
      },
      donation_history: donationHistory,
    })

  } catch (error: any) {
    console.error('Error fetching donor:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}