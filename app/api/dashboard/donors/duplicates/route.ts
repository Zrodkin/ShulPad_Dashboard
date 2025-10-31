// app/api/dashboard/donors/duplicates/route.ts
// Detect potential duplicate donors based on email and name matching

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

    const db = createClient()

    // Find duplicates by email (same email, different names including NULL)
    const emailDuplicatesResult = await db.execute(
      `SELECT
        d.donor_email,
        d.donor_name,
        COUNT(DISTINCT d.id) as donation_count,
        SUM(d.amount) as total_amount,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.donor_email IS NOT NULL
      GROUP BY d.donor_email, d.donor_name
      HAVING d.donor_email IN (
        SELECT donor_email
        FROM donations d2
        JOIN square_connections sc2 ON d2.organization_id = sc2.organization_id
        WHERE sc2.merchant_id = ?
          AND d2.payment_status = 'COMPLETED'
          AND d2.donor_email IS NOT NULL
        GROUP BY d2.donor_email
        HAVING COUNT(DISTINCT COALESCE(d2.donor_name, '__NULL__')) > 1
      )
      ORDER BY d.donor_email, d.donor_name`,
      [merchant_id, merchant_id]
    )

    // Group email duplicates by email address
    const emailDuplicatesMap = new Map<string, any[]>()
    for (const row of emailDuplicatesResult.rows) {
      const email = row.donor_email as string
      if (!emailDuplicatesMap.has(email)) {
        emailDuplicatesMap.set(email, [])
      }
      emailDuplicatesMap.get(email)!.push({
        email: row.donor_email,
        name: row.donor_name || null,
        donation_count: parseInt(row.donation_count),
        total_amount: parseFloat(row.total_amount).toFixed(2),
        first_donation: row.first_donation,
        last_donation: row.last_donation,
      })
    }

    // Find duplicates by similar names (case-insensitive, different emails or no email)
    // First, get all unique donor names (lowercased) that appear more than once
    const nameDuplicatesResult = await db.execute(
      `SELECT
        LOWER(d.donor_name) as name_lower,
        d.donor_name,
        d.donor_email,
        COUNT(DISTINCT d.id) as donation_count,
        SUM(d.amount) as total_amount,
        MIN(d.created_at) as first_donation,
        MAX(d.created_at) as last_donation
      FROM donations d
      JOIN square_connections sc ON d.organization_id = sc.organization_id
      WHERE sc.merchant_id = ?
        AND d.payment_status = 'COMPLETED'
        AND d.donor_name IS NOT NULL
      GROUP BY LOWER(d.donor_name), d.donor_name, d.donor_email
      HAVING LOWER(d.donor_name) IN (
        SELECT LOWER(d2.donor_name)
        FROM donations d2
        JOIN square_connections sc2 ON d2.organization_id = sc2.organization_id
        WHERE sc2.merchant_id = ?
          AND d2.payment_status = 'COMPLETED'
          AND d2.donor_name IS NOT NULL
        GROUP BY LOWER(d2.donor_name)
        HAVING COUNT(DISTINCT CONCAT(
          COALESCE(d2.donor_email, '__NULL__'),
          '_',
          d2.donor_name
        )) > 1
      )
      ORDER BY name_lower, d.donor_email, d.donor_name`,
      [merchant_id, merchant_id]
    )

    // Group name duplicates by lowercase name
    const nameDuplicatesMap = new Map<string, any[]>()
    for (const row of nameDuplicatesResult.rows) {
      const nameLower = row.name_lower as string
      if (!nameDuplicatesMap.has(nameLower)) {
        nameDuplicatesMap.set(nameLower, [])
      }
      nameDuplicatesMap.get(nameLower)!.push({
        email: row.donor_email || null,
        name: row.donor_name,
        donation_count: parseInt(row.donation_count),
        total_amount: parseFloat(row.total_amount).toFixed(2),
        first_donation: row.first_donation,
        last_donation: row.last_donation,
      })
    }

    // Format the results
    const duplicateGroups = []

    // Add email-based duplicate groups
    for (const [email, donors] of emailDuplicatesMap.entries()) {
      if (donors.length > 1) {
        const totalDonations = donors.reduce((sum, d) => sum + d.donation_count, 0)
        const totalAmount = donors.reduce((sum, d) => sum + parseFloat(d.total_amount), 0)

        duplicateGroups.push({
          type: 'email',
          key: email,
          donors,
          stats: {
            total_donations: totalDonations,
            total_amount: totalAmount.toFixed(2),
          },
        })
      }
    }

    // Add name-based duplicate groups (excluding those already in email duplicates)
    for (const [nameLower, donors] of nameDuplicatesMap.entries()) {
      if (donors.length > 1) {
        // Check if this group is already covered by email duplicates
        const allSameEmail = donors.every(d => d.email && d.email === donors[0].email)
        if (allSameEmail) continue // Skip if all have the same email (already handled above)

        const totalDonations = donors.reduce((sum, d) => sum + d.donation_count, 0)
        const totalAmount = donors.reduce((sum, d) => sum + parseFloat(d.total_amount), 0)

        duplicateGroups.push({
          type: 'name',
          key: nameLower,
          donors,
          stats: {
            total_donations: totalDonations,
            total_amount: totalAmount.toFixed(2),
          },
        })
      }
    }

    return NextResponse.json({
      duplicate_groups: duplicateGroups,
      total_groups: duplicateGroups.length,
      total_donors_affected: duplicateGroups.reduce((sum, g) => sum + g.donors.length, 0),
    })

  } catch (error: any) {
    console.error('Error fetching duplicate donors:', error)

    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
