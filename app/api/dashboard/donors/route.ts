// app/api/dashboard/donors/route.ts
// Get list of donors with their donation totals and statistics

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentOrganizationId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const organization_id = await getCurrentOrganizationId()

    if (!organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Filters
    const search = searchParams.get('search')
    const minTotal = searchParams.get('min_total')
    const minDonations = searchParams.get('min_donations')
    const hasEmail = searchParams.get('has_email')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'total_donated'
    const sortOrder = searchParams.get('sort_order') || 'DESC'

    const db = createClient()

    // Build WHERE clause for date filtering
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

    // Get aggregated donor data
    let havingConditions: string[] = []
    let havingParams: any[] = []

    if (minTotal) {
      havingConditions.push('total_donated >= ?')
      havingParams.push(parseFloat(minTotal))
    }

    if (minDonations) {
      havingConditions.push('donation_count >= ?')
      havingParams.push(parseInt(minDonations))
    }

    const havingClause = havingConditions.length > 0 
      ? `HAVING ${havingConditions.join(' AND ')}` 
      : ''

    // Build search filter
    let searchFilter = ''
    let searchParams_arr: any[] = []
    if (search) {
      searchFilter = 'AND (d.donor_name LIKE ? OR d.donor_email LIKE ?)'
      searchParams_arr = [`%${search}%`, `%${search}%`]
    }

    if (hasEmail === 'true') {
      searchFilter += ' AND d.donor_email IS NOT NULL'
    } else if (hasEmail === 'false') {
      searchFilter += ' AND d.donor_email IS NULL'
    }

    // Get total count of unique donors
    const countResult = await db.execute(
      `SELECT COUNT(DISTINCT 
         CASE 
           WHEN d.donor_email IS NOT NULL THEN d.donor_email 
           ELSE CONCAT('anon_', d.id)
         END
       ) as total
       FROM donations d
       WHERE d.organization_id = ? 
         AND d.payment_status = 'COMPLETED'
         ${dateFilter}
         ${searchFilter}`,
      [organization_id, ...dateParams, ...searchParams_arr]
    )

    const totalCount = parseInt(countResult.rows[0].total)

    // Validate sortBy
    const validSortColumns = ['total_donated', 'donation_count', 'average_donation', 'first_donation', 'last_donation', 'donor_name']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'total_donated'
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Get aggregated donor data with pagination
    const donorsResult = await db.execute(
      `SELECT 
        COALESCE(d.donor_email, CONCAT('anonymous_', MIN(d.id))) as donor_identifier,
        d.donor_email,
        COALESCE(d.donor_name, 'Anonymous Donor') as donor_name,
        COUNT(d.id) as donation_count,
        SUM(d.amount) as total_donated,
        AVG(d.amount) as average_donation,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation,
        SUM(CASE WHEN d.receipt_sent = 1 THEN 1 ELSE 0 END) as receipts_sent,
        SUM(CASE WHEN d.is_recurring = 1 THEN 1 ELSE 0 END) as recurring_donations
      FROM donations d
      WHERE d.organization_id = ? 
        AND d.payment_status = 'COMPLETED'
        ${dateFilter}
        ${searchFilter}
      GROUP BY d.donor_email, d.donor_name
      ${havingClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?`,
      [organization_id, ...dateParams, ...searchParams_arr, ...havingParams, limit, offset]
    )

    const donors = donorsResult.rows.map((row: any) => ({
      donor_email: row.donor_email,
      donor_name: row.donor_name,
      is_anonymous: !row.donor_email,
      donation_count: parseInt(row.donation_count),
      total_donated: parseFloat(row.total_donated).toFixed(2),
      average_donation: parseFloat(row.average_donation).toFixed(2),
      first_donation: row.first_donation,
      last_donation: row.last_donation,
      receipts_sent: parseInt(row.receipts_sent),
      recurring_donations: parseInt(row.recurring_donations),
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      donors,
      pagination: {
        page,
        limit,
        total_count: totalCount,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
      filters_applied: {
        search,
        min_total: minTotal,
        min_donations: minDonations,
        has_email: hasEmail,
        start_date: startDate,
        end_date: endDate,
      },
    })

  } catch (error: any) {
    console.error('Error fetching donors:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}