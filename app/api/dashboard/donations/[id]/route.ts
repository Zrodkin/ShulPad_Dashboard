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
        o.square_merchant_id,
        'donations' as source_table
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      LEFT JOIN organizations o ON d.organization_id = o.id
      WHERE sc.merchant_id = ? AND (d.payment_id = ? OR d.id = ?)
      LIMIT 1`,
      [merchant_id, id, id]
    )

    let row: any

    if (donationResult.rows.length === 0) {
      // If not found in donations table, try receipt_log table
      const receiptLogResult = await db.execute(
        `SELECT
          rl.id,
          rl.organization_id,
          rl.amount,
          'USD' as currency,
          NULL as donor_name,
          rl.donor_email,
          rl.transaction_id as payment_id,
          rl.order_id as square_order_id,
          'COMPLETED' as payment_status,
          1 as receipt_sent,
          0 as is_custom_amount,
          NULL as catalog_item_id,
          'one_time' as donation_type,
          0 as is_recurring,
          rl.requested_at as created_at,
          rl.updated_at,
          o.name as organization_name,
          o.square_merchant_id,
          'receipt_log' as source_table
        FROM receipt_log rl
        JOIN square_connections sc ON rl.organization_id = sc.organization_id
        LEFT JOIN organizations o ON rl.organization_id = o.id
        WHERE sc.merchant_id = ? AND (rl.transaction_id = ? OR rl.id = ?)
        LIMIT 1`,
        [merchant_id, id, id]
      )

      if (receiptLogResult.rows.length === 0) {
        return NextResponse.json({
          error: 'Donation not found'
        }, { status: 404 })
      }

      row = receiptLogResult.rows[0]
    } else {
      row = donationResult.rows[0]
    }

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
      source_table: row.source_table, // For debugging purposes
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
