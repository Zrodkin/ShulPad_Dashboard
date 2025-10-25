// app/api/dashboard/auth/login/route.ts
// Initiate Square OAuth for merchant dashboard login

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID
    const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'sandbox'
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    if (!SQUARE_APPLICATION_ID) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 500 })
    }

    // Generate random state for CSRF protection
    const state = randomBytes(32).toString('hex')
    
    // Store state in database for verification
    const db = createClient()
    await db.execute(
      `INSERT INTO square_pending_tokens (state, created_at) 
       VALUES (?, NOW())`,
      [state]
    )

    // Build Square OAuth URL for dashboard (different from iOS)
    const squareAuthUrl = SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com/oauth2/authorize'
      : 'https://connect.squareupsandbox.com/oauth2/authorize'

    const params = new URLSearchParams({
      client_id: SQUARE_APPLICATION_ID,
      scope: 'MERCHANT_PROFILE_READ PAYMENTS_READ CUSTOMERS_READ ORDERS_READ SUBSCRIPTIONS_READ',
      state,
      // IMPORTANT: Different redirect URI for dashboard (not iOS)
      redirect_uri: `${BASE_URL}/api/dashboard/auth/callback`,
    })

    const authorizationUrl = `${squareAuthUrl}?${params.toString()}`

    return NextResponse.json({ 
      authorization_url: authorizationUrl,
      state 
    })

  } catch (error) {
    console.error('Error initiating dashboard OAuth:', error)
    return NextResponse.json({ error: 'Failed to initiate login' }, { status: 500 })
  }
}