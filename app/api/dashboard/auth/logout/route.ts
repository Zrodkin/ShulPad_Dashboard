// app/api/dashboard/auth/logout/route.ts
// Logout from merchant dashboard

import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/dashboard-auth'

export async function POST() {
  try {
    await clearSessionCookie()

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}