import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/dashboard-auth'

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    await clearSessionCookie()

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      error: 'Failed to logout'
    }, { status: 500 })
  }
}
