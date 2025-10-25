// app/api/dashboard/auth/session/route.ts
// Get current dashboard session

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/dashboard-auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      organization_id: session.organization_id,
      merchant_id: session.merchant_id,
      merchant_name: session.merchant_name,
      email: session.email,
      is_super_admin: session.is_super_admin,
      impersonating: session.impersonating,
    })

  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}