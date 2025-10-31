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
    let donationsDateFilter = ''
    let receiptLogDateFilter = ''
    switch (period) {
      case 'today':
        donationsDateFilter = 'AND DATE(d.created_at) = CURDATE()'
        receiptLogDateFilter = 'AND DATE(rl.requested_at) = CURDATE()'
        break
      case 'week':
        donationsDateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        receiptLogDateFilter = 'AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        donationsDateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        receiptLogDateFilter = 'AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      case 'year':
        donationsDateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        receiptLogDateFilter = 'AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        break
      default:
        donationsDateFilter = ''
        receiptLogDateFilter = ''
    }

    // Get overall statistics from donations table
    const donationsStatsResult = await db.execute(
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
        ${donationsDateFilter}`,
      [merchant_id]
    )

    // Get overall statistics from receipt_log table (excluding duplicates)
    const receiptLogStatsResult = await db.execute(
      `SELECT
        COUNT(DISTINCT rl.id) as total_donations,
        COUNT(DISTINCT rl.donor_email) as unique_donors,
        COALESCE(SUM(rl.amount), 0) as total_amount,
        COALESCE(AVG(rl.amount), 0) as average_donation,
        COUNT(DISTINCT rl.id) as receipts_sent
      FROM receipt_log rl
      JOIN square_connections sc ON rl.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND rl.delivery_status = 'sent'
        AND rl.donor_email IS NOT NULL
        AND rl.transaction_id NOT IN (
          SELECT d.payment_id FROM donations d
          JOIN square_connections sc2 ON d.organization_id = sc2.organization_id
          WHERE sc2.merchant_id = ?
        )
        ${receiptLogDateFilter}`,
      [merchant_id, merchant_id]
    )

    // Get today's donation count from both tables
    const todayDonationsResult = await db.execute(
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

    const todayReceiptLogResult = await db.execute(
      `SELECT
        COUNT(DISTINCT rl.id) as today_donations
      FROM receipt_log rl
      JOIN square_connections sc ON rl.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND rl.delivery_status = 'sent'
        AND DATE(rl.requested_at) >= CURDATE()
        AND DATE(rl.requested_at) < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND rl.transaction_id NOT IN (
          SELECT d.payment_id FROM donations d
          JOIN square_connections sc2 ON d.organization_id = sc2.organization_id
          WHERE sc2.merchant_id = ?
        )`,
      [merchant_id, merchant_id]
    )

    const donationsStats = donationsStatsResult.rows[0]
    const receiptLogStats = receiptLogStatsResult.rows[0]
    const todayDonationsCount = parseInt(todayDonationsResult.rows[0].today_donations)
    const todayReceiptLogCount = parseInt(todayReceiptLogResult.rows[0].today_donations)

    // Combine statistics
    const stats = {
      total_donations: parseInt(donationsStats.total_donations) + parseInt(receiptLogStats.total_donations),
      total_amount: parseFloat(donationsStats.total_amount) + parseFloat(receiptLogStats.total_amount),
      average_donation: 0, // Will calculate after
      unique_donors: parseInt(donationsStats.unique_donors) + parseInt(receiptLogStats.unique_donors), // Note: may have some overlap
      recurring_donations: parseInt(donationsStats.recurring_donations), // Only from donations table
      receipts_sent: parseInt(donationsStats.receipts_sent) + parseInt(receiptLogStats.receipts_sent),
    }

    stats.average_donation = stats.total_donations > 0 ? stats.total_amount / stats.total_donations : 0

    const todayStats = {
      today_donations: todayDonationsCount + todayReceiptLogCount
    }

    // Get comparison with previous period
    let donationsComparisonFilter = ''
    let receiptLogComparisonFilter = ''
    switch (period) {
      case 'today':
        donationsComparisonFilter = 'AND DATE(d.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        receiptLogComparisonFilter = 'AND DATE(rl.requested_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)'
        break
      case 'week':
        donationsComparisonFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND d.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        receiptLogComparisonFilter = 'AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND rl.requested_at < DATE_SUB(NOW(), INTERVAL 7 DAY)'
        break
      case 'month':
        donationsComparisonFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND d.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        receiptLogComparisonFilter = 'AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND rl.requested_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        break
      default:
        donationsComparisonFilter = ''
        receiptLogComparisonFilter = ''
    }

    let previousStats = { total_amount: 0, total_donations: 0 }
    if (donationsComparisonFilter) {
      const donationsComparisonResult = await db.execute(
        `SELECT
          COUNT(d.id) as total_donations,
          COALESCE(SUM(d.amount), 0) as total_amount
        FROM donations d
        JOIN square_connections sc ON d.organization_id = sc.organization_id
        WHERE sc.merchant_id = ?
          AND d.payment_status = 'COMPLETED'
          ${donationsComparisonFilter}`,
        [merchant_id]
      )

      const receiptLogComparisonResult = await db.execute(
        `SELECT
          COUNT(rl.id) as total_donations,
          COALESCE(SUM(rl.amount), 0) as total_amount
        FROM receipt_log rl
        JOIN square_connections sc ON rl.organization_id = sc.organization_id
        WHERE sc.merchant_id = ?
          AND rl.delivery_status = 'sent'
          AND rl.transaction_id NOT IN (
            SELECT d.payment_id FROM donations d
            JOIN square_connections sc2 ON d.organization_id = sc2.organization_id
            WHERE sc2.merchant_id = ?
          )
          ${receiptLogComparisonFilter}`,
        [merchant_id, merchant_id]
      )

      const donationsPrevious = donationsComparisonResult.rows[0]
      const receiptLogPrevious = receiptLogComparisonResult.rows[0]

      previousStats = {
        total_donations: parseInt(donationsPrevious.total_donations) + parseInt(receiptLogPrevious.total_donations),
        total_amount: parseFloat(donationsPrevious.total_amount) + parseFloat(receiptLogPrevious.total_amount)
      }
    }

    // Calculate percentage changes
    const amountChange = previousStats.total_amount > 0
      ? ((stats.total_amount - previousStats.total_amount) / previousStats.total_amount * 100)
      : 0

    const countChange = previousStats.total_donations > 0
      ? ((stats.total_donations - previousStats.total_donations) / previousStats.total_donations * 100)
      : 0

    // Get recent donations trend (last 30 days, grouped by day) from both tables
    const donationsTrendResult = await db.execute(
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

    const receiptLogTrendResult = await db.execute(
      `SELECT
        DATE(rl.requested_at) as date,
        COUNT(rl.id) as count,
        COALESCE(SUM(rl.amount), 0) as total
      FROM receipt_log rl
      JOIN square_connections sc ON rl.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND rl.delivery_status = 'sent'
        AND rl.requested_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND rl.transaction_id NOT IN (
          SELECT d.payment_id FROM donations d
          JOIN square_connections sc2 ON d.organization_id = sc2.organization_id
          WHERE sc2.merchant_id = ?
        )
      GROUP BY DATE(rl.requested_at)
      ORDER BY date ASC`,
      [merchant_id, merchant_id]
    )

    // Combine trend data
    const trendMap = new Map()

    donationsTrendResult.rows.forEach((row: any) => {
      // Handle date conversion - it might be a Date object, string, or need formatting
      const dateStr = row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date).split('T')[0]
      trendMap.set(dateStr, {
        count: parseInt(row.count),
        total: parseFloat(row.total)
      })
    })

    receiptLogTrendResult.rows.forEach((row: any) => {
      // Handle date conversion - it might be a Date object, string, or need formatting
      const dateStr = row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date).split('T')[0]
      const existing = trendMap.get(dateStr) || { count: 0, total: 0 }
      trendMap.set(dateStr, {
        count: existing.count + parseInt(row.count),
        total: existing.total + parseFloat(row.total)
      })
    })

    const trendData = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        total: data.total.toFixed(2)
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      period,
      stats: {
        total_donations: stats.total_donations,
        total_amount: stats.total_amount.toFixed(2),
        average_donation: stats.average_donation.toFixed(2),
        today_donations: todayStats.today_donations,
        unique_donors: stats.unique_donors,
        recurring_donations: stats.recurring_donations,
        receipts_sent: stats.receipts_sent,
      },
      changes: {
        amount_change: parseFloat(amountChange.toFixed(1)),
        count_change: parseFloat(countChange.toFixed(1)),
      },
      trend: trendData,
    })

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}