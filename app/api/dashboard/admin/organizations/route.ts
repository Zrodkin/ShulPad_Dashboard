// app/api/dashboard/admin/organizations/route.ts
// Super admin endpoint to list all organizations

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET() {
  try {
    // Require super admin access
    const session = await requireAuth(true)

    const db = createClient()

    // Get all organizations with their stats
    const result = await db.execute(`
      SELECT 
        sc.organization_id,
        sc.merchant_id,
        COUNT(DISTINCT d.id) as total_donations,
        COALESCE(SUM(d.amount), 0) as total_amount,
        COUNT(DISTINCT d.donor_email) as unique_donors,
        MAX(d.created_at) as last_donation_at,
        MIN(d.created_at) as first_donation_at
      FROM square_connections sc
      LEFT JOIN donations d ON d.organization_id = sc.organization_id AND d.payment_status = 'COMPLETED'
      GROUP BY sc.organization_id, sc.merchant_id
      ORDER BY total_amount DESC
    `)

    const organizations = result.rows.map((row: any) => ({
      organization_id: row.organization_id,
      merchant_id: row.merchant_id,
      total_donations: parseInt(row.total_donations),
      total_amount: parseFloat(row.total_amount || 0).toFixed(2),
      unique_donors: parseInt(row.unique_donors || 0),
      last_donation_at: row.last_donation_at,
      first_donation_at: row.first_donation_at,
    }))

    return NextResponse.json({
      organizations,
      total_count: organizations.length,
    })

  } catch (error: any) {
    console.error('Error fetching organizations:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}