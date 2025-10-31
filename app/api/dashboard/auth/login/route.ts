// app/api/dashboard/auth/login/route.ts
// Initiate Square OAuth for merchant dashboard login

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/db'

export async function GET(request: NextRequest) {
  console.log('ENV CHECK:', {
    SQUARE_APP_ID: process.env.SQUARE_APP_ID ? 'EXISTS' : 'MISSING',
    REDIRECT_URI: process.env.REDIRECT_URI ? 'EXISTS' : 'MISSING',
    all_env_keys: Object.keys(process.env).filter(k => k.includes('SQUARE'))
  })
  try {
    const SQUARE_APP_ID = process.env.SQUARE_APP_ID
    const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'production'
    const REDIRECT_URI = process.env.REDIRECT_URI
    
    if (!SQUARE_APP_ID || !REDIRECT_URI) {
      console.error('Missing Square configuration')
      return NextResponse.json({ error: 'Square not configured' }, { status: 500 })
    }

    // Generate random state for CSRF protection
    const state = randomBytes(32).toString('hex')
    
    // Store state in database with flow_type=dashboard
    const db = createClient()
    try {
      await db.execute(
        `INSERT INTO square_pending_tokens (
          state, 
          device_id,
          organization_id,
          flow_type,
          access_token, 
          refresh_token, 
          merchant_id, 
          expires_at, 
          location_id, 
          location_data
        ) VALUES (?, NULL, NULL, 'dashboard', NULL, NULL, NULL, NULL, NULL, NULL)`,
        [state]
      )
      console.log('✅ Stored pending token for dashboard login:', state)
    } catch (dbError) {
      console.error('❌ Database error storing pending token:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Build Square OAuth URL
    const squareAuthUrl = SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com/oauth2/authorize'
      : 'https://connect.squareupsandbox.com/oauth2/authorize'

    // Dashboard needs read-only scopes
    const scopes = [
      'MERCHANT_PROFILE_READ',
      'PAYMENTS_READ',
      'CUSTOMERS_READ',
      'ORDERS_READ',
      'SUBSCRIPTIONS_READ',
      'EMPLOYEES_READ'
    ]

    const params = new URLSearchParams({
      client_id: SQUARE_APP_ID,
      scope: scopes.join(' '),
      state,
      session: 'false',
      redirect_uri: REDIRECT_URI, // Uses the unified callback
    })

    const authorizationUrl = `${squareAuthUrl}?${params.toString()}`

    console.log('🚀 Dashboard OAuth initiated:', { 
      state: state.substring(0, 8) + '...', 
      redirect_uri: REDIRECT_URI 
    })

    // Redirect user directly to Square OAuth
    return NextResponse.redirect(authorizationUrl)

  } catch (error) {
    console.error('❌ Error initiating dashboard OAuth:', error)
    return NextResponse.json({ 
      error: 'Failed to initiate login',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}