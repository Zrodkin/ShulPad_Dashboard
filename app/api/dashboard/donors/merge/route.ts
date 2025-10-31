// app/api/dashboard/donors/merge/route.ts
// Merge multiple donor records into a single donor identity

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

interface MergeRequest {
  primary_email: string | null
  primary_name: string
  donor_identifiers_to_merge: string[]
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const body: MergeRequest = await request.json()
    const { primary_email, primary_name, donor_identifiers_to_merge } = body

    // Validate inputs
    if (!primary_name || !donor_identifiers_to_merge || donor_identifiers_to_merge.length < 2) {
      return NextResponse.json(
        { error: 'Must provide primary_name and at least 2 donor identifiers to merge' },
        { status: 400 }
      )
    }

    const db = createClient()

    // Parse donor identifiers into email/name pairs
    const donorsToMerge = donor_identifiers_to_merge.map(identifier => {
      if (identifier.startsWith('name_without_email_')) {
        return {
          email: null,
          name: identifier.replace('name_without_email_', ''),
        }
      } else {
        return {
          email: identifier,
          name: null, // We'll match any name with this email
        }
      }
    })

    // Build WHERE conditions for each donor to merge
    const whereConditions: string[] = []
    const queryParams: any[] = []

    donorsToMerge.forEach(donor => {
      if (donor.email) {
        // Match by email (any name)
        whereConditions.push('(d.donor_email = ?)')
        queryParams.push(donor.email)
      } else if (donor.name) {
        // Match by name with no email
        whereConditions.push('(d.donor_email IS NULL AND d.donor_name = ?)')
        queryParams.push(donor.name)
      }
    })

    if (whereConditions.length === 0) {
      return NextResponse.json(
        { error: 'No valid donor identifiers provided' },
        { status: 400 }
      )
    }

    // First, verify all donations belong to this merchant
    const verifyResult = await db.execute(
      `SELECT COUNT(d.id) as count
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND (${whereConditions.join(' OR ')})`,
      [merchant_id, ...queryParams]
    )

    const donationsToMerge = parseInt(verifyResult.rows[0].count)

    if (donationsToMerge === 0) {
      return NextResponse.json(
        { error: 'No donations found for the specified donors' },
        { status: 404 }
      )
    }

    // Update all matching donations to use the primary donor info
    const updateResult = await db.execute(
      `UPDATE donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      SET d.donor_email = ?,
          d.donor_name = ?
      WHERE sc.merchant_id = ?
        AND (${whereConditions.join(' OR ')})`,
      [primary_email, primary_name, merchant_id, ...queryParams]
    )

    // Get the updated donor's statistics
    const statsResult = await db.execute(
      `SELECT
        COUNT(d.id) as donation_count,
        SUM(d.amount) as total_donated,
        AVG(d.amount) as average_donation,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND ${primary_email ? 'd.donor_email = ?' : '(d.donor_email IS NULL AND d.donor_name = ?)'}`,
      [merchant_id, primary_email || primary_name]
    )

    const mergedStats = statsResult.rows[0]

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${donor_identifiers_to_merge.length} donor records`,
      merged_donor: {
        email: primary_email,
        name: primary_name,
        donation_count: parseInt(mergedStats.donation_count),
        total_donated: parseFloat(mergedStats.total_donated).toFixed(2),
        average_donation: parseFloat(mergedStats.average_donation).toFixed(2),
        first_donation: mergedStats.first_donation,
        last_donation: mergedStats.last_donation,
      },
      donations_updated: donationsToMerge,
    })

  } catch (error: any) {
    console.error('Error merging donors:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
