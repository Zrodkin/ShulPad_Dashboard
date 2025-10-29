// app/api/dashboard/export/route.ts
// Export donations data as CSV or PDF

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
    const format = searchParams.get('format') || 'csv' // csv or json
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const includeAnonymous = searchParams.get('include_anonymous') === 'true'

    const db = createClient()

    // Build date filter
    let dateFilter = ''
    let dateParams: any[] = []

    if (startDate) {
      dateFilter += ' AND d.created_at >= ?'
      dateParams.push(startDate)
    }

    if (endDate) {
      dateFilter += ' AND d.created_at <= ?'
      dateParams.push(endDate)
    }

    if (!includeAnonymous) {
      dateFilter += ' AND d.donor_email IS NOT NULL'
    }

    // Get all donations matching criteria across all merchant organizations
    const result = await db.execute(
      `SELECT
        d.id,
        d.created_at,
        d.amount,
        d.currency,
        d.donor_name,
        d.donor_email,
        d.payment_id,
        d.square_order_id,
        d.donation_type,
        d.is_recurring,
        d.is_custom_amount,
        d.receipt_sent,
        d.payment_status
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        ${dateFilter}
      ORDER BY d.created_at DESC`,
      [merchant_id, ...dateParams]
    )

    const donations = result.rows

    if (format === 'json') {
      return NextResponse.json({
        donations,
        exported_at: new Date().toISOString(),
        total_count: donations.length,
        total_amount: donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0).toFixed(2),
      })
    }

    // CSV Export
    const csvHeaders = [
      'Date',
      'Amount',
      'Currency',
      'Donor Name',
      'Donor Email',
      'Payment ID',
      'Order ID',
      'Donation Type',
      'Is Recurring',
      'Is Custom Amount',
      'Receipt Sent',
      'Status',
    ]

    const csvRows = donations.map((d: any) => [
      new Date(d.created_at).toISOString(),
      d.amount,
      d.currency,
      d.donor_name || 'Anonymous',
      d.donor_email || '',
      d.payment_id || '',
      d.square_order_id || '',
      d.donation_type || 'one_time',
      d.is_recurring ? 'Yes' : 'No',
      d.is_custom_amount ? 'Yes' : 'No',
      d.receipt_sent ? 'Yes' : 'No',
      d.payment_status,
    ])

    // Build CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any[]) => 
        row.map(cell => {
          // Escape cells that contain commas or quotes
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      ),
    ].join('\n')

    // Add summary row
    const totalAmount = donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0)
    const summaryRow = `\n\nSummary,,,,,,,,,,\nTotal Donations,${donations.length},,,,,,,,,\nTotal Amount,${totalAmount.toFixed(2)},${donations[0]?.currency || 'USD'},,,,,,,,`

    const finalCsv = csvContent + summaryRow

    // Return CSV file
    const filename = `shulpad-donations-${startDate || 'all'}-to-${endDate || 'now'}.csv`

    return new NextResponse(finalCsv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error('Error exporting data:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}