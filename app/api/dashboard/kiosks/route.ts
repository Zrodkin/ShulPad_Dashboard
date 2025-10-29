// app/api/dashboard/kiosks/route.ts
// Get kiosk locations and their statistics

import { NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET() {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const db = createClient()

    // Get kiosk locations with their stats across all merchant organizations
    const result = await db.execute(
      `SELECT
        sc.location_id,
        sc.location_name,
        COUNT(DISTINCT d.id) as total_donations,
        COALESCE(SUM(d.amount), 0) as total_amount,
        MAX(d.created_at) as last_active,
        CASE
          WHEN MAX(d.created_at) >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) THEN 'online'
          ELSE 'offline'
        END as status
      FROM square_connections sc
      LEFT JOIN donations d ON d.location_id = sc.location_id
        AND d.organization_id = sc.organization_id
        AND d.payment_status = 'COMPLETED'
      WHERE sc.merchant_id = ?
      GROUP BY sc.location_id, sc.location_name
      ORDER BY total_amount DESC`,
      [merchant_id]
    )

    const kiosks = result.rows.map((row: any) => {
      const lastActive = row.last_active ? new Date(row.last_active) : null
      const now = new Date()

      let lastActiveText = 'Never'
      if (lastActive) {
        const diffMs = now.getTime() - lastActive.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) {
          lastActiveText = 'Just now'
        } else if (diffMins < 60) {
          lastActiveText = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
        } else if (diffHours < 24) {
          lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else {
          lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        }
      }

      return {
        id: row.location_id,
        location: row.location_name || 'Unknown Location',
        status: row.status,
        totalDonations: `$${parseFloat(row.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        totalDonationsRaw: parseFloat(row.total_amount || 0),
        lastActive: lastActiveText,
        donationCount: parseInt(row.total_donations || 0),
      }
    })

    return NextResponse.json({
      kiosks,
      total_count: kiosks.length,
    })

  } catch (error: any) {
    console.error('Error fetching kiosks:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
