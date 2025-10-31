// app/api/dashboard/stats/route.ts
// Get dashboard statistics (total donations, donors, averages, etc.)

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'all' // today, week, month, all

    const db = createClient()

    // Build date filter based on period
    let dateFilter = ''
    switch (period) {
      case 'today':
        dateFilter = 'AND DATE(d.created_at) = CURDATE()'
        break
      case 'week':
        dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      case 'year':
        dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        break
      default:
        dateFilter = ''
    }

    // Get overall statistics across all merchant organizations
    const statsResult = await db.execute(
      `SELECT
        COUNT(DISTINCT d.id) as total_donations,
        COUNT(DISTINCT
          CASE
            WHEN d.donor_email IS NOT NULL THEN d.donor_email
            WHEN d.donor_name IS NOT NULL AND d.donor_name != '' THEN CONCAT('name_', d.donor_name)
            ELSE NULL
          END
        ) as unique_donors,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COALESCE(AVG(d.amount), 0) as average_donation,
        COUNT(DISTINCT CASE WHEN d.is_recurring = 1 THEN d.id END) as recurring_donations,
        COUNT(DISTINCT CASE WHEN d.receipt_sent = 1 THEN d.id END) as receipts_sent
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND NOT (d.donor_email IS NULL AND (d.donor_name IS NULL OR d.donor_name = ''))
        ${dateFilter}`,
      [merchant_id]
    )

    // Get today's donation count (always, regardless of period filter)
    // Using CONVERT_TZ to handle timezone conversions properly
    // This ensures we're comparing dates in the correct timezone
    const todayStatsResult = await db.execute(
      `SELECT
        COUNT(DISTINCT d.id) as today_donations
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND DATE(d.created_at) >= CURDATE()
        AND DATE(d.created_at) < DATE_ADD(CURDATE(), INTERVAL 1 DAY)`,
      [merchant_id]
    )

    const stats = statsResult.rows[0]
    const todayStats = todayStatsResult.rows[0]

    // Get comparison with previous period
    let comparisonFilter = ''
    switch (period) {
      case 'today':
        comparisonFilter = 'AND DATE(d.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        break
      case 'week':
        comparisonFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND d.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        comparisonFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND d.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      default:
        comparisonFilter = ''
    }

    let previousStats = { total_amount: 0, total_donations: 0 }
    if (comparisonFilter) {
      const comparisonResult = await db.execute(
        `SELECT
          COUNT(d.id) as total_donations,
          COALESCE(SUM(d.amount), 0) as total_amount
        FROM donations d
        JOIN square_connections sc ON d.organization_id = sc.organization_id
        WHERE sc.merchant_id = ?
          AND d.payment_status = 'COMPLETED'
          ${comparisonFilter}`,
        [merchant_id]
      )
      previousStats = comparisonResult.rows[0]
    }

    // Calculate percentage changes
    const amountChange = previousStats.total_amount > 0
      ? ((stats.total_amount - previousStats.total_amount) / previousStats.total_amount * 100)
      : 0

    const countChange = previousStats.total_donations > 0
      ? ((stats.total_donations - previousStats.total_donations) / previousStats.total_donations * 100)
      : 0

    // Get recent donations trend (last 30 days, grouped by day) across all merchant organizations
    const trendResult = await db.execute(
      `SELECT
        DATE(d.created_at) as date,
        COUNT(d.id) as count,
        COALESCE(SUM(d.amount), 0) as total
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(d.created_at)
      ORDER BY date ASC`,
      [merchant_id]
    )

    return NextResponse.json({
      period,
      stats: {
        total_donations: parseInt(stats.total_donations),
        total_amount: parseFloat(stats.total_amount).toFixed(2),
        average_donation: parseFloat(stats.average_donation).toFixed(2),
        today_donations: parseInt(todayStats.today_donations),
        unique_donors: parseInt(stats.unique_donors),
        recurring_donations: parseInt(stats.recurring_donations),
        receipts_sent: parseInt(stats.receipts_sent),
      },
      changes: {
        amount_change: parseFloat(amountChange.toFixed(1)),
        count_change: parseFloat(countChange.toFixed(1)),
      },
      trend: trendResult.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count),
        total: parseFloat(row.total).toFixed(2),
      })),
    })

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}