// app/api/dashboard/donations/route.ts
// Modified to fetch donations across ALL organizations for a merchant using JOIN pattern

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentMerchantId } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    // Get merchant ID from session
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({
        error: 'No merchant found'
      }, { status: 404 })
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
    const search = searchParams.get('search')
    const organizationFilter = searchParams.get('organization_id') // Optional: filter by specific org

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'DESC'

    const db = createClient()

    // Build WHERE clause for donations table
    let donationsWhereConditions: string[] = []
    let donationsParams: any[] = []

    // Use JOIN with square_connections to filter by merchant_id
    donationsWhereConditions.push('sc.merchant_id = ?')
    donationsParams.push(merchant_id)

    // Optional: filter by specific organization if requested
    if (organizationFilter) {
      donationsWhereConditions.push('d.organization_id = ?')
      donationsParams.push(organizationFilter)
    }

    donationsWhereConditions.push("d.payment_status = 'COMPLETED'")

    if (startDate) {
      donationsWhereConditions.push('DATE(d.created_at) >= ?')
      donationsParams.push(startDate)
    }

    if (endDate) {
      donationsWhereConditions.push('DATE(d.created_at) <= ?')
      donationsParams.push(endDate)
    }

    if (minAmount) {
      donationsWhereConditions.push('d.amount >= ?')
      donationsParams.push(parseFloat(minAmount))
    }

    if (maxAmount) {
      donationsWhereConditions.push('d.amount <= ?')
      donationsParams.push(parseFloat(maxAmount))
    }

    if (donorEmail) {
      donationsWhereConditions.push('d.donor_email LIKE ?')
      donationsParams.push(`%${donorEmail}%`)
    }

    if (donorName) {
      donationsWhereConditions.push('d.donor_name LIKE ?')
      donationsParams.push(`%${donorName}%`)
    }

    if (isRecurring !== null && isRecurring !== undefined) {
      donationsWhereConditions.push('d.is_recurring = ?')
      donationsParams.push(isRecurring === 'true' ? 1 : 0)
    }

    if (receiptSent !== null && receiptSent !== undefined) {
      donationsWhereConditions.push('d.receipt_sent = ?')
      donationsParams.push(receiptSent === 'true' ? 1 : 0)
    }

    if (donationType) {
      donationsWhereConditions.push('d.donation_type = ?')
      donationsParams.push(donationType)
    }

    if (search) {
      donationsWhereConditions.push('(d.donor_name LIKE ? OR d.donor_email LIKE ? OR d.payment_id LIKE ?)')
      donationsParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const donationsWhereClause = donationsWhereConditions.join(' AND ')

    // Build WHERE clause for receipt_log table (only filters that make sense)
    let receiptLogWhereConditions: string[] = []
    let receiptLogParams: any[] = []

    receiptLogWhereConditions.push('sc.merchant_id = ?')
    receiptLogParams.push(merchant_id)

    if (organizationFilter) {
      receiptLogWhereConditions.push('rl.organization_id = ?')
      receiptLogParams.push(organizationFilter)
    }

    // Only show 'sent' receipts (equivalent to COMPLETED payments)
    receiptLogWhereConditions.push("rl.delivery_status = 'sent'")

    if (startDate) {
      receiptLogWhereConditions.push('DATE(rl.requested_at) >= ?')
      receiptLogParams.push(startDate)
    }

    if (endDate) {
      receiptLogWhereConditions.push('DATE(rl.requested_at) <= ?')
      receiptLogParams.push(endDate)
    }

    if (minAmount) {
      receiptLogWhereConditions.push('rl.amount >= ?')
      receiptLogParams.push(parseFloat(minAmount))
    }

    if (maxAmount) {
      receiptLogWhereConditions.push('rl.amount <= ?')
      receiptLogParams.push(parseFloat(maxAmount))
    }

    if (donorEmail) {
      receiptLogWhereConditions.push('rl.donor_email LIKE ?')
      receiptLogParams.push(`%${donorEmail}%`)
    }

    if (search) {
      receiptLogWhereConditions.push('(rl.donor_email LIKE ? OR rl.transaction_id LIKE ?)')
      receiptLogParams.push(`%${search}%`, `%${search}%`)
    }

    // Exclude receipt_log entries that already exist in donations table
    receiptLogWhereConditions.push(`rl.transaction_id NOT IN (
      SELECT d.payment_id FROM donations d
      JOIN square_connections sc2 ON d.organization_id = sc2.organization_id
      WHERE sc2.merchant_id = ?
    )`)
    receiptLogParams.push(merchant_id)

    const receiptLogWhereClause = receiptLogWhereConditions.join(' AND ')

    // Validate sortBy to prevent SQL injection
    const validSortColumns = ['created_at', 'amount', 'donor_name', 'donor_email', 'organization_id']
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    // Get total count from both tables
    const donationsCountResult = await db.execute(
      `SELECT COUNT(*) as total
       FROM donations d
       JOIN square_connections sc ON d.organization_id = sc.organization_id
       WHERE ${donationsWhereClause}`,
      donationsParams
    )

    const receiptLogCountResult = await db.execute(
      `SELECT COUNT(*) as total
       FROM receipt_log rl
       JOIN square_connections sc ON rl.organization_id = sc.organization_id
       WHERE ${receiptLogWhereClause}`,
      receiptLogParams
    )

    const totalCount = parseInt(donationsCountResult.rows[0].total) + parseInt(receiptLogCountResult.rows[0].total)
    const totalPages = Math.ceil(totalCount / limit)

    // Get donations from donations table
    const donationsResult = await db.execute(
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
      WHERE ${donationsWhereClause}`,
      donationsParams
    )

    // Get donations from receipt_log table (excluding duplicates)
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
      WHERE ${receiptLogWhereClause}`,
      receiptLogParams
    )

    // Combine results
    const allDonations = [
      ...donationsResult.rows,
      ...receiptLogResult.rows
    ]

    // Sort combined results
    allDonations.sort((a: any, b: any) => {
      const aValue = a[safeSortBy]
      const bValue = b[safeSortBy]

      if (safeSortOrder === 'ASC') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination to combined results
    const paginatedDonations = allDonations.slice(offset, offset + limit)

    const donations = paginatedDonations.map((row: any) => ({
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
    }))

    // Get summary statistics from both tables
    const donationsStatsResult = await db.execute(
      `SELECT
        COUNT(DISTINCT d.organization_id) as total_organizations,
        SUM(d.amount) as total_amount,
        AVG(d.amount) as average_amount,
        COUNT(DISTINCT d.donor_email) as unique_donors
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE ${donationsWhereClause}`,
      donationsParams
    )

    const receiptLogStatsResult = await db.execute(
      `SELECT
        COUNT(DISTINCT rl.organization_id) as total_organizations,
        SUM(rl.amount) as total_amount,
        AVG(rl.amount) as average_amount,
        COUNT(DISTINCT rl.donor_email) as unique_donors
      FROM receipt_log rl
      JOIN square_connections sc ON rl.organization_id = sc.organization_id
      WHERE ${receiptLogWhereClause}`,
      receiptLogParams
    )

    const donationsStats = donationsStatsResult.rows[0]
    const receiptLogStats = receiptLogStatsResult.rows[0]

    // Combine statistics
    const totalOrganizations = new Set([
      ...allDonations.map((d: any) => d.organization_id)
    ]).size

    const totalAmount = (parseFloat(donationsStats.total_amount || 0) + parseFloat(receiptLogStats.total_amount || 0))
    const averageAmount = totalAmount / totalCount

    const uniqueDonors = new Set([
      ...allDonations.map((d: any) => d.donor_email).filter(Boolean)
    ]).size

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
      statistics: {
        total_organizations: totalOrganizations,
        total_amount: totalAmount.toFixed(2),
        average_amount: averageAmount.toFixed(2),
        unique_donors: uniqueDonors,
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
        organization_id: organizationFilter,
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