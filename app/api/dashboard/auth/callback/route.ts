// app/api/dashboard/auth/callback/route.ts
// Handle Square OAuth callback for merchant dashboard

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/dashboard-auth'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Check for OAuth errors
    if (error) {
      console.error('Square OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/dashboard/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/login?error=Invalid callback parameters', request.url)
      )
    }

    // Verify state to prevent CSRF
    const db = createClient()
    const stateCheck = await db.execute(
      `SELECT id FROM square_pending_tokens 
       WHERE state = ? AND obtained = 0 
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       LIMIT 1`,
      [state]
    )

    if (stateCheck.rows.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/login?error=Invalid or expired state', request.url)
      )
    }

    // Exchange authorization code for access token
    const SQUARE_APPLICATION_ID = process.env.SQUARE_APPLICATION_ID
    const SQUARE_APPLICATION_SECRET = process.env.SQUARE_APPLICATION_SECRET
    const SQUARE_ENVIRONMENT = process.env.SQUARE_ENVIRONMENT || 'sandbox'
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const tokenUrl = SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com/oauth2/token'
      : 'https://connect.squareupsandbox.com/oauth2/token'

    const tokenResponse = await axios.post(tokenUrl, {
      client_id: SQUARE_APPLICATION_ID,
      client_secret: SQUARE_APPLICATION_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${BASE_URL}/api/dashboard/auth/callback`,
    })

    const {
      access_token,
      refresh_token,
      expires_at,
      merchant_id,
    } = tokenResponse.data

    // Get merchant profile information
    const squareDomain = SQUARE_ENVIRONMENT === 'production'
      ? 'connect.squareup.com'
      : 'connect.squareupsandbox.com'

    let merchantName = 'Organization'
    let merchantEmail = null

    try {
      const merchantResponse = await axios.get(
        `https://${squareDomain}/v2/merchants/${merchant_id}`,
        {
          headers: {
            'Square-Version': '2025-07-16',
            'Authorization': `Bearer ${access_token}`,
          },
        }
      )
      merchantName = merchantResponse.data.merchant?.business_name || merchantName
      merchantEmail = merchantResponse.data.merchant?.email || null
    } catch (error) {
      console.warn('Could not fetch merchant profile:', error)
    }

    // Get location ID (required for some operations)
    let location_id = null
    try {
      const locationsResponse = await axios.get(
        `https://${squareDomain}/v2/locations`,
        {
          headers: {
            'Square-Version': '2025-07-16',
            'Authorization': `Bearer ${access_token}`,
          },
        }
      )
      location_id = locationsResponse.data.locations?.[0]?.id || null
    } catch (error) {
      console.warn('Could not fetch locations:', error)
    }

    // Use merchant_id as organization_id (or create your own logic)
    const organization_id = merchant_id

    // Store/update Square connection in database
    await db.execute(
      `INSERT INTO square_connections 
       (organization_id, merchant_id, location_id, access_token, refresh_token, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         expires_at = VALUES(expires_at),
         location_id = VALUES(location_id),
         updated_at = NOW()`,
      [organization_id, merchant_id, location_id, access_token, refresh_token, expires_at]
    )

    // Mark state as used
    await db.execute(
      `UPDATE square_pending_tokens SET obtained = 1 WHERE state = ?`,
      [state]
    )

    // Create session token
    const sessionToken = await createSession(
      organization_id,
      merchant_id,
      merchantName,
      merchantEmail
    )

    // Set session cookie
    await setSessionCookie(sessionToken)

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))

  } catch (error: any) {
    console.error('Error handling OAuth callback:', error)
    const errorMessage = error.response?.data?.message || 'Authentication failed'
    return NextResponse.redirect(
      new URL(`/dashboard/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}