// app/api/dashboard/settings/email/route.ts
// API endpoint to get and update merchant email in square_connections table

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentMerchantId } from '@/lib/dashboard-auth'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({
        error: 'No merchant found'
      }, { status: 404 })
    }

    const db = createClient()

    // Get the merchant email from square_connections table
    const result = await db.execute(
      'SELECT merchant_email FROM square_connections WHERE merchant_id = ? AND is_active = 1 LIMIT 1',
      [merchant_id]
    )

    const rows = result.rows as any[]

    return NextResponse.json({
      email: rows.length > 0 ? rows[0].merchant_email : null
    })

  } catch (error) {
    console.error('Error fetching merchant email:', error)
    return NextResponse.json({
      error: 'Failed to fetch email'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const merchant_id = await getCurrentMerchantId()

    if (!merchant_id) {
      return NextResponse.json({
        error: 'No merchant found'
      }, { status: 404 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Invalid email format'
      }, { status: 400 })
    }

    const db = createClient()

    // Update the merchant_email in square_connections table for this merchant
    const result = await db.execute(
      'UPDATE square_connections SET merchant_email = ?, updated_at = NOW() WHERE merchant_id = ? AND is_active = 1',
      [email, merchant_id]
    )

    // Check if any rows were affected
    if (result.rowsAffected === 0) {
      return NextResponse.json({
        error: 'No active merchant connection found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      email: email
    })

  } catch (error) {
    console.error('Error updating merchant email:', error)
    return NextResponse.json({
      error: 'Failed to update email'
    }, { status: 500 })
  }
}
