// app/api/dashboard/donations/[id]/route.ts
// API route to fetch a single donation by payment_id or id

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentMerchantId } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    // Get merchant ID from session
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({
        error: 'No merchant found'
      }, { status: 404 })
    }

    const { id } = await params
    const db = createClient()

    // Try to find donation by payment_id first, then by id
    // Use JOIN with square_connections to ensure merchant has access
    const donationResult = await db.execute(
      `SELECT
        d.id,
        d.organization_id,
        d.amount,
        d.currency,
        d.donor_name,
        d.donor_email,
        d.payment_id,
        d.square_order_id,
        d.payment_status,
        d.receipt_sent,
        d.is_custom_amount,
        d.catalog_item_id,
        d.donation_type,
        d.is_recurring,
        d.created_at,
        d.updated_at,
        o.name as organization_name,
        o.square_merchant_id
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      LEFT JOIN organizations o ON d.organization_id = o.id
      WHERE sc.merchant_id = ? AND (d.payment_id = ? OR d.id = ?)
      LIMIT 1`,
      [merchant_id, id, id]
    )

    if (donationResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Donation not found'
      }, { status: 404 })
    }

    const row = donationResult.rows[0]

    const donation = {
      id: row.id,
      organization_id: row.organization_id,
      organization_name: row.organization_name,
      amount: parseFloat(row.amount),
      currency: row.currency,
      donor_name: row.donor_name,
      donor_email: row.donor_email,
      payment_id: row.payment_id,
      square_order_id: row.square_order_id,
      payment_status: row.payment_status,
      receipt_sent: Boolean(row.receipt_sent),
      is_custom_amount: Boolean(row.is_custom_amount),
      catalog_item_id: row.catalog_item_id,
      donation_type: row.donation_type || 'one_time',
      is_recurring: Boolean(row.is_recurring),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }

    return NextResponse.json({ donation })

  } catch (error: any) {
    console.error('Error fetching donation:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
