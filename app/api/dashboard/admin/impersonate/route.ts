// app/api/dashboard/admin/impersonate/route.ts
// Super admin endpoint to impersonate an organization

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, impersonateOrganization, setSessionCookie } from '@/lib/dashboard-auth'

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    const session = await requireAuth(true)

    const body = await request.json()
    const { organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    // Create impersonation token
    const impersonationToken = await impersonateOrganization(session, organization_id)

    // Set the impersonation session
    await setSessionCookie(impersonationToken)

    return NextResponse.json({
      success: true,
      message: `Now viewing as organization: ${organization_id}`,
      organization_id,
    })

  } catch (error: any) {
    console.error('Error impersonating organization:', error)
    
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (error.message === 'FORBIDDEN' || error.message.includes('super admin')) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
    }
    
    if (error.message === 'Organization not found') {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Stop impersonation and return to admin view
export async function DELETE() {
  try {
    const session = await requireAuth(true)

    if (!session.is_super_admin) {
      return NextResponse.json({ error: 'Not a super admin' }, { status: 403 })
    }

    // Clear impersonation by creating a new admin-only session
    const { createSession, setSessionCookie } = await import('@/lib/dashboard-auth')
    const adminToken = await createSession(
      session.organization_id,
      session.merchant_id,
      session.merchant_name,
      session.email
    )

    await setSessionCookie(adminToken)

    return NextResponse.json({
      success: true,
      message: 'Stopped impersonation',
    })

  } catch (error: any) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}