// app/api/dashboard/donors/merge/route.ts
// Merge multiple donor records into a single unified identity

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

interface DonorToMerge {
  email: string | null
  name: string | null
}

interface MergeRequest {
  donors_to_merge: DonorToMerge[]
  primary_donor: {
    email: string | null
    name: string
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const body: MergeRequest = await request.json()
    const { donors_to_merge, primary_donor } = body

    // Validation
    if (!donors_to_merge || !Array.isArray(donors_to_merge) || donors_to_merge.length < 2) {
      return NextResponse.json(
        { error: 'Must provide at least 2 donors to merge' },
        { status: 400 }
      )
    }

    if (!primary_donor || !primary_donor.name) {
      return NextResponse.json(
        { error: 'Must provide primary donor with a name' },
        { status: 400 }
      )
    }

    // Collect all unique emails from donors being merged
    const uniqueEmails = new Set<string>()
    for (const donor of donors_to_merge) {
      if (donor.email && donor.email.trim()) {
        uniqueEmails.add(donor.email.trim())
      }
    }

    // If primary donor has an email, ensure it's included
    if (primary_donor.email && primary_donor.email.trim()) {
      uniqueEmails.add(primary_donor.email.trim())
    }

    // Create comma-separated email list or use single email/null
    const mergedEmail = uniqueEmails.size > 0
      ? Array.from(uniqueEmails).join(', ')
      : null

    const db = createClient()

    // Build the WHERE conditions for finding donations to merge
    const conditions: string[] = []
    const params: any[] = []

    for (const donor of donors_to_merge) {
      if (donor.email && donor.name) {
        // Both email and name
        conditions.push('(d.donor_email = ? AND d.donor_name = ?)')
        params.push(donor.email, donor.name)
      } else if (donor.email && !donor.name) {
        // Email only (name is NULL)
        conditions.push('(d.donor_email = ? AND d.donor_name IS NULL)')
        params.push(donor.email)
      } else if (!donor.email && donor.name) {
        // Name only (email is NULL)
        conditions.push('(d.donor_email IS NULL AND d.donor_name = ?)')
        params.push(donor.name)
      } else {
        // Skip invalid entries
        continue
      }
    }

    if (conditions.length === 0) {
      return NextResponse.json(
        { error: 'No valid donors to merge' },
        { status: 400 }
      )
    }

    // Count donations that will be updated (for logging/verification)
    // Use JOIN with square_connections to ensure we only affect this merchant's donations
    const countResult = await db.execute(
      `SELECT COUNT(*) as count
       FROM donations d
       JOIN square_connections sc ON d.organization_id = sc.organization_id
       WHERE sc.merchant_id = ?
         AND d.payment_status = 'COMPLETED'
         AND (${conditions.join(' OR ')})`,
      [merchant_id, ...params]
    )

    const donationsToUpdate = parseInt(countResult.rows[0].count)

    if (donationsToUpdate === 0) {
      return NextResponse.json(
        { error: 'No donations found matching the donors to merge' },
        { status: 404 }
      )
    }

    // Update all matching donations to use the primary donor's information
    // Use JOIN with square_connections to ensure we only update this merchant's donations
    const updateResult = await db.execute(
      `UPDATE donations d
       JOIN square_connections sc ON d.organization_id = sc.organization_id
       SET d.donor_email = ?,
           d.donor_name = ?,
           d.updated_at = NOW()
       WHERE sc.merchant_id = ?
         AND d.payment_status = 'COMPLETED'
         AND (${conditions.join(' OR ')})`,
      [mergedEmail, primary_donor.name, merchant_id, ...params]
    )

    // Get updated statistics for the merged donor
    const statsResult = await db.execute(
      `SELECT
        COUNT(d.id) as donation_count,
        SUM(d.amount) as total_donated,
        AVG(d.amount) as average_donation,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation,
        SUM(CASE WHEN d.receipt_sent = 1 THEN 1 ELSE 0 END) as receipts_sent,
        SUM(CASE WHEN d.is_recurring = 1 THEN 1 ELSE 0 END) as recurring_donations,
        COUNT(DISTINCT d.organization_id) as organizations_donated_to
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.donor_email ${mergedEmail ? '= ?' : 'IS NULL'}
        AND d.donor_name = ?`,
      mergedEmail
        ? [merchant_id, mergedEmail, primary_donor.name]
        : [merchant_id, primary_donor.name]
    )

    const stats = statsResult.rows[0]

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${donationsToUpdate} donations`,
      merged_donor: {
        email: mergedEmail,
        name: primary_donor.name,
        donation_count: parseInt(stats.donation_count),
        total_donated: parseFloat(stats.total_donated).toFixed(2),
        average_donation: parseFloat(stats.average_donation).toFixed(2),
        first_donation: stats.first_donation,
        last_donation: stats.last_donation,
        receipts_sent: parseInt(stats.receipts_sent),
        recurring_donations: parseInt(stats.recurring_donations),
        organizations_donated_to: parseInt(stats.organizations_donated_to),
      },
      donations_updated: donationsToUpdate,
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
