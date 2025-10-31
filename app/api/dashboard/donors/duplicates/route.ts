// app/api/dashboard/donors/duplicates/route.ts
// Detect potential duplicate donors based on email and name matching

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentMerchantId, requireAuth } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

interface DonorGroup {
  email: string | null
  name: string
  donor_identifier: string
  donation_count: number
  total_donated: string
  first_donation: string
  last_donation: string
}

interface DuplicateGroup {
  match_type: 'same_email' | 'similar_name'
  match_key: string
  donors: DonorGroup[]
  total_donations: number
  total_amount: string
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({ error: 'No merchant found' }, { status: 404 })
    }

    const db = createClient()

    // Get all donors grouped by email and name
    const donorsResult = await db.execute(
      `SELECT
        d.donor_email,
        COALESCE(d.donor_name, 'Anonymous Donor') as donor_name,
        COUNT(d.id) as donation_count,
        SUM(d.amount) as total_donated,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
      GROUP BY d.donor_email, d.donor_name
      HAVING donation_count > 0
      ORDER BY total_donated DESC`,
      [merchant_id]
    )

    const donors = donorsResult.rows.map((row: any) => ({
      email: row.donor_email,
      name: row.donor_name,
      donor_identifier: row.donor_email || `name_without_email_${row.donor_name}`,
      donation_count: parseInt(row.donation_count),
      total_donated: parseFloat(row.total_donated).toFixed(2),
      first_donation: row.first_donation,
      last_donation: row.last_donation,
    }))

    // Find duplicates
    const duplicateGroups: DuplicateGroup[] = []

    // 1. Group by email (donors with same email but different names)
    const emailGroups = new Map<string, DonorGroup[]>()
    donors.forEach((donor: DonorGroup) => {
      if (donor.email) {
        const normalizedEmail = donor.email.toLowerCase().trim()
        if (!emailGroups.has(normalizedEmail)) {
          emailGroups.set(normalizedEmail, [])
        }
        emailGroups.get(normalizedEmail)!.push(donor)
      }
    })

    // Add email-based duplicates (where there are multiple entries for same email)
    emailGroups.forEach((group, email) => {
      if (group.length > 1) {
        duplicateGroups.push({
          match_type: 'same_email',
          match_key: email,
          donors: group,
          total_donations: group.reduce((sum, d) => sum + d.donation_count, 0),
          total_amount: group.reduce((sum, d) => sum + parseFloat(d.total_donated), 0).toFixed(2),
        })
      }
    })

    // 2. Group by normalized name (case-insensitive, trimmed)
    // Only include donors that aren't already in an email-based group
    const emailsInDuplicates = new Set(
      duplicateGroups.flatMap(g => g.donors.map(d => d.email).filter(e => e !== null))
    )

    const nameGroups = new Map<string, DonorGroup[]>()
    donors.forEach((donor: DonorGroup) => {
      // Skip if this donor is already in an email-based duplicate group
      if (donor.email && emailsInDuplicates.has(donor.email)) {
        return
      }

      // Skip anonymous donors
      if (donor.name === 'Anonymous Donor') {
        return
      }

      const normalizedName = donor.name.toLowerCase().trim().replace(/\s+/g, ' ')
      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, [])
      }
      nameGroups.get(normalizedName)!.push(donor)
    })

    // Add name-based duplicates (where there are multiple entries for similar names)
    nameGroups.forEach((group, name) => {
      if (group.length > 1) {
        duplicateGroups.push({
          match_type: 'similar_name',
          match_key: name,
          donors: group,
          total_donations: group.reduce((sum, d) => sum + d.donation_count, 0),
          total_amount: group.reduce((sum, d) => sum + parseFloat(d.total_donated), 0).toFixed(2),
        })
      }
    })

    return NextResponse.json({
      duplicate_groups: duplicateGroups,
      total_groups: duplicateGroups.length,
      total_affected_donors: duplicateGroups.reduce((sum, g) => sum + g.donors.length, 0),
    })

  } catch (error: any) {
    console.error('Error detecting duplicates:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
