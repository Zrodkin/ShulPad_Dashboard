// app/api/dashboard/auth/callback-handler/route.ts
// Receives session info from server and creates local session

import { NextRequest, NextResponse } from 'next/server'
import { createSession, setSessionCookie } from '@/lib/dashboard-auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const merchantId = searchParams.get('merchant_id')
    const locationId = searchParams.get('location_id')
    const organizationId = searchParams.get('organization_id')
    const merchantEmail = searchParams.get('merchant_email')

    console.log('✅ Callback handler received:', {
      merchantId,
      locationId,
      organizationId,
      merchantEmail
    })

    if (!merchantId || !locationId || !organizationId) {
      console.error('❌ Missing required parameters')
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/login?error=missing_params`)
    }

    // Create JWT session
    const sessionToken = await createSession(
      organizationId,
      merchantId,
      undefined, // merchant_name
      merchantEmail || undefined
    )

    // Set session cookie
    await setSessionCookie(sessionToken)

    console.log('✅ Session created successfully, redirecting to dashboard')

    // Redirect to dashboard
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`)

  } catch (error) {
    console.error('❌ Error creating session:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard/login?error=session_failed`)
  }
}