// app/api/dashboard/reports/route.ts
// Get report data for donations analytics

import { NextResponse } from 'next/server'
import { getCurrentOrganizationId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET() {
  try {
    await requireAuth()
    const organization_id = await getCurrentOrganizationId()

    if (!organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const db = createClient()

    // Get donations by month (last 12 months, showing only last 7 months with data)
    const monthlyResult = await db.execute(
      `SELECT
        DATE_FORMAT(d.created_at, '%b') as month,
        DATE_FORMAT(d.created_at, '%Y-%m') as month_key,
        SUM(d.amount) as amount
      FROM donations d
      WHERE d.organization_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month_key, month
      ORDER BY month_key DESC
      LIMIT 7`,
      [organization_id]
    )

    const donationsByMonth = monthlyResult.rows.reverse().map((row: any) => ({
      month: row.month,
      amount: parseFloat(row.amount || 0),
    }))

    // Get donations by kiosk location
    const kioskResult = await db.execute(
      `SELECT
        sc.location_id,
        sc.location_name,
        COALESCE(SUM(d.amount), 0) as value
      FROM square_connections sc
      LEFT JOIN donations d ON d.location_id = sc.location_id
        AND d.organization_id = sc.organization_id
        AND d.payment_status = 'COMPLETED'
      WHERE sc.organization_id = ?
      GROUP BY sc.location_id, sc.location_name
      ORDER BY value DESC
      LIMIT 5`,
      [organization_id]
    )

    const colors = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]

    const donationsByKiosk = kioskResult.rows.map((row: any, index: number) => ({
      name: row.location_name || 'Unknown Location',
      value: parseFloat(row.value || 0),
      color: colors[index % colors.length],
    }))

    // Get best performing kiosk
    const bestKiosk = kioskResult.rows[0]
    const bestPerformingKiosk = {
      name: bestKiosk?.location_name || 'N/A',
      total: bestKiosk ? parseFloat(bestKiosk.value || 0) : 0,
    }

    // Get peak donation time
    const peakTimeResult = await db.execute(
      `SELECT
        HOUR(d.created_at) as hour,
        COUNT(d.id) as count
      FROM donations d
      WHERE d.organization_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY hour
      ORDER BY count DESC
      LIMIT 1`,
      [organization_id]
    )

    const peakHour = peakTimeResult.rows[0]?.hour
    let peakTime = 'N/A'
    if (peakHour !== undefined && peakHour !== null) {
      const startHour = parseInt(peakHour)
      const endHour = (startHour + 2) % 24
      const formatHour = (h: number) => {
        if (h === 0) return '12 AM'
        if (h === 12) return '12 PM'
        if (h < 12) return `${h} AM`
        return `${h - 12} PM`
      }
      peakTime = `${formatHour(startHour)}-${formatHour(endHour)}`
    }

    // Get growth rate (comparing last 90 days to previous 90 days)
    const currentPeriodResult = await db.execute(
      `SELECT COALESCE(SUM(d.amount), 0) as total
      FROM donations d
      WHERE d.organization_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [organization_id]
    )

    const previousPeriodResult = await db.execute(
      `SELECT COALESCE(SUM(d.amount), 0) as total
      FROM donations d
      WHERE d.organization_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.created_at >= DATE_SUB(NOW(), INTERVAL 180 DAY)
        AND d.created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [organization_id]
    )

    const currentTotal = parseFloat(currentPeriodResult.rows[0]?.total || 0)
    const previousTotal = parseFloat(previousPeriodResult.rows[0]?.total || 0)

    let growthRate = 0
    if (previousTotal > 0) {
      growthRate = ((currentTotal - previousTotal) / previousTotal) * 100
    } else if (currentTotal > 0) {
      growthRate = 100
    }

    return NextResponse.json({
      donationsByMonth,
      donationsByKiosk,
      insights: {
        bestPerformingKiosk,
        peakTime,
        growthRate: growthRate.toFixed(1),
      },
    })

  } catch (error: any) {
    console.error('Error fetching reports data:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
