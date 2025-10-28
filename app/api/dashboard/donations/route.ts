// app/api/dashboard/donations/route.ts
// Get list of donations with filtering, sorting, and pagination

import { NextRequest, NextResponse } from 'next/server'
import { getMerchantOrganizationIds, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const organizationIds = await getMerchantOrganizationIds()

    if (organizationIds.length === 0) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const minAmount = searchParams.get('min_amount')
    const maxAmount = searchParams.get('max_amount')
    const donorEmail = searchParams.get('donor_email')
    const donorName = searchParams.get('donor_name')
    const isRecurring = searchParams.get('is_recurring')
    const receiptSent = searchParams.get('receipt_sent')
    const donationType = searchParams.get('donation_type')
    const search = searchParams.get('search') // General search

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'DESC'

    const db = createClient()

    // Build WHERE clause
    const orgPlaceholders = organizationIds.map(() => '?').join(', ')
    let whereConditions = [`d.organization_id IN (${orgPlaceholders})`, "d.payment_status = 'COMPLETED'"]
    let params: any[] = [...organizationIds]

    if (startDate) {
      whereConditions.push('DATE(d.created_at) >= ?')
      params.push(startDate)
    }

    if (endDate) {
      whereConditions.push('DATE(d.created_at) <= ?')
      params.push(endDate)
    }

    if (minAmount) {
      whereConditions.push('d.amount >= ?')
      params.push(parseFloat(minAmount))
    }

    if (maxAmount) {
      whereConditions.push('d.amount <= ?')
      params.push(parseFloat(maxAmount))
    }

    if (donorEmail) {
      whereConditions.push('d.donor_email LIKE ?')
      params.push(`%${donorEmail}%`)
    }

    if (donorName) {
      whereConditions.push('d.donor_name LIKE ?')
      params.push(`%${donorName}%`)
    }

    if (isRecurring !== null && isRecurring !== undefined) {
      whereConditions.push('d.is_recurring = ?')
      params.push(isRecurring === 'true' ? 1 : 0)
    }

    if (receiptSent !== null && receiptSent !== undefined) {
      whereConditions.push('d.receipt_sent = ?')
      params.push(receiptSent === 'true' ? 1 : 0)
    }

    if (donationType) {
      whereConditions.push('d.donation_type = ?')
      params.push(donationType)
    }

    if (search) {
      whereConditions.push('(d.donor_name LIKE ? OR d.donor_email LIKE ? OR d.payment_id LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const whereClause = whereConditions.join(' AND ')

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'amount', 'donor_name', 'donor_email']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Get total count
    const countResult = await db.execute(
      `SELECT COUNT(*) as total
       FROM donations d
       WHERE ${whereClause}`,
      params
    )

    const totalCount = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(totalCount / limit)

    // Get donations
    const donationsResult = await db.execute(
      `SELECT 
        d.id,
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
        d.updated_at
      FROM donations d
      WHERE ${whereClause}
      ORDER BY d.${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    const donations = donationsResult.rows.map((row: any) => ({
      id: row.id,
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
    }))

    return NextResponse.json({
      donations,
      pagination: {
        page,
        limit,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      filters_applied: {
        start_date: startDate,
        end_date: endDate,
        min_amount: minAmount,
        max_amount: maxAmount,
        donor_email: donorEmail,
        donor_name: donorName,
        is_recurring: isRecurring,
        receipt_sent: receiptSent,
        donation_type: donationType,
        search,
      },
    })

  } catch (error: any) {
    console.error('Error fetching donations:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}