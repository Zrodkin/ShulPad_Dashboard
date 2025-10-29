// app/api/dashboard/charts/route.ts
// Get chart data for dashboard visualizations

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const chartType = searchParams.get('type') || 'donations_over_time'
    const period = searchParams.get('period') || '30days' // 7days, 30days, 90days, year, all
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const db = createClient()

    // Build date filter
    let dateFilter = ''
    let dateParams: any[] = []

    if (startDate && endDate) {
      dateFilter = 'AND d.created_at >= ? AND d.created_at <= ?'
      dateParams = [startDate, endDate]
    } else {
      switch (period) {
        case '7days':
          dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
          break
        case '30days':
          dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
          break
        case '90days':
          dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)'
          break
        case 'year':
          dateFilter = 'AND d.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
          break
        case 'all':
          dateFilter = ''
          break
      }
    }

    let chartData: any = {}

    switch (chartType) {
      case 'donations_over_time': {
        // Daily donations grouped by date across all merchant organizations
        const result = await db.execute(
          `SELECT
            DATE(d.created_at) as date,
            COUNT(d.id) as count,
            SUM(d.amount) as total,
            AVG(d.amount) as average
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY DATE(d.created_at)
          ORDER BY date ASC`,
          [merchant_id, ...dateParams]
        )

        chartData = {
          type: 'line',
          data: result.rows.map((row: any) => ({
            date: row.date,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
            average: parseFloat(row.average).toFixed(2),
          })),
        }
        break
      }

      case 'donations_by_hour': {
        // Donations grouped by hour of day (useful for understanding peak times)
        const result = await db.execute(
          `SELECT
            HOUR(d.created_at) as hour,
            COUNT(d.id) as count,
            SUM(d.amount) as total
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY HOUR(d.created_at)
          ORDER BY hour ASC`,
          [merchant_id, ...dateParams]
        )

        chartData = {
          type: 'bar',
          data: result.rows.map((row: any) => ({
            hour: parseInt(row.hour),
            hour_label: `${row.hour}:00`,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
          })),
        }
        break
      }

      case 'donations_by_day_of_week': {
        // Donations grouped by day of week
        const result = await db.execute(
          `SELECT
            DAYOFWEEK(d.created_at) as day_number,
            DAYNAME(d.created_at) as day_name,
            COUNT(d.id) as count,
            SUM(d.amount) as total,
            AVG(d.amount) as average
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY day_number, day_name
          ORDER BY day_number ASC`,
          [merchant_id, ...dateParams]
        )

        chartData = {
          type: 'bar',
          data: result.rows.map((row: any) => ({
            day: row.day_name,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
            average: parseFloat(row.average).toFixed(2),
          })),
        }
        break
      }

      case 'donations_by_amount_range': {
        // Donations grouped by amount ranges
        const result = await db.execute(
          `SELECT
            CASE
              WHEN d.amount < 25 THEN '$0-$24'
              WHEN d.amount < 50 THEN '$25-$49'
              WHEN d.amount < 100 THEN '$50-$99'
              WHEN d.amount < 250 THEN '$100-$249'
              WHEN d.amount < 500 THEN '$250-$499'
              WHEN d.amount < 1000 THEN '$500-$999'
              ELSE '$1000+'
            END as range_label,
            CASE
              WHEN d.amount < 25 THEN 1
              WHEN d.amount < 50 THEN 2
              WHEN d.amount < 100 THEN 3
              WHEN d.amount < 250 THEN 4
              WHEN d.amount < 500 THEN 5
              WHEN d.amount < 1000 THEN 6
              ELSE 7
            END as range_order,
            COUNT(d.id) as count,
            SUM(d.amount) as total
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY range_label, range_order
          ORDER BY range_order ASC`,
          [merchant_id, ...dateParams]
        )

        chartData = {
          type: 'pie',
          data: result.rows.map((row: any) => ({
            range: row.range_label,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
            percentage: 0, // Will be calculated on frontend
          })),
        }
        break
      }

      case 'donation_types': {
        // One-time vs recurring donations
        const result = await db.execute(
          `SELECT
            CASE
              WHEN d.is_recurring = 1 THEN 'Recurring'
              ELSE 'One-Time'
            END as type,
            COUNT(d.id) as count,
            SUM(d.amount) as total
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY type`,
          [merchant_id, ...dateParams]
        )

        chartData = {
          type: 'pie',
          data: result.rows.map((row: any) => ({
            type: row.type,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
          })),
        }
        break
      }

      case 'top_donors': {
        // Top donors by total amount across all merchant organizations
        const limit = parseInt(searchParams.get('limit') || '10')

        const result = await db.execute(
          `SELECT
            COALESCE(d.donor_name, 'Anonymous') as donor_name,
            d.donor_email,
            COUNT(d.id) as donation_count,
            SUM(d.amount) as total_donated
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            ${dateFilter}
          GROUP BY donor_name, d.donor_email
          ORDER BY total_donated DESC
          LIMIT ?`,
          [merchant_id, ...dateParams, limit]
        )

        chartData = {
          type: 'bar',
          data: result.rows.map((row: any) => ({
            donor_name: row.donor_name,
            donor_email: row.donor_email,
            donation_count: parseInt(row.donation_count),
            total_donated: parseFloat(row.total_donated).toFixed(2),
          })),
        }
        break
      }

      case 'monthly_comparison': {
        // Compare donations by month (last 12 months) across all merchant organizations
        const result = await db.execute(
          `SELECT
            DATE_FORMAT(d.created_at, '%Y-%m') as month,
            DATE_FORMAT(d.created_at, '%b %Y') as month_label,
            COUNT(d.id) as count,
            SUM(d.amount) as total,
            AVG(d.amount) as average
          FROM donations d
          JOIN square_connections sc ON d.organization_id = sc.organization_id
          WHERE sc.merchant_id = ?
            AND d.payment_status = 'COMPLETED'
            AND d.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY month, month_label
          ORDER BY month ASC`,
          [merchant_id]
        )

        chartData = {
          type: 'line',
          data: result.rows.map((row: any) => ({
            month: row.month,
            month_label: row.month_label,
            count: parseInt(row.count),
            total: parseFloat(row.total).toFixed(2),
            average: parseFloat(row.average).toFixed(2),
          })),
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 })
    }

    return NextResponse.json({
      chart_type: chartType,
      period,
      ...chartData,
    })

  } catch (error: any) {
    console.error('Error fetching chart data:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}