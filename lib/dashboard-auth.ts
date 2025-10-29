// src/lib/dashboard-auth.ts
// Authentication utilities for merchant dashboard
// MODIFIED: Added functions to fetch ALL organizations for a merchant

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@/lib/db'

const JWT_SECRET = new TextEncoder().encode(
  process.env.DASHBOARD_JWT_SECRET || 'your-secret-key-change-in-production'
)

// Developer super-admin email (you can have multiple)
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '').split(',').filter(Boolean)

export interface DashboardSession {
  organization_id: string
  merchant_id: string
  merchant_name?: string
  email?: string
  is_super_admin: boolean
  impersonating?: string // If admin is viewing another org
}

/**
 * Create a JWT session token for authenticated merchant
 */
export async function createSession(
  organization_id: string,
  merchant_id: string,
  merchant_name?: string,
  email?: string
): Promise<string> {
  const is_super_admin = email ? SUPER_ADMIN_EMAILS.includes(email) : false

  const token = await new SignJWT({
    organization_id,
    merchant_id,
    merchant_name,
    email,
    is_super_admin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d') // 30 day session
    .setIssuedAt()
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode JWT session token
 */
export async function verifySession(token: string): Promise<DashboardSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as unknown as DashboardSession
  } catch (error) {
    return null
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<DashboardSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('dashboard_session')?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('dashboard_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('dashboard_session')
}

/**
 * Check if user is authenticated, optionally require super admin
 */
export async function requireAuth(requireSuperAdmin = false): Promise<DashboardSession> {
  const session = await getSession()

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  if (requireSuperAdmin && !session.is_super_admin) {
    throw new Error('FORBIDDEN')
  }

  return session
}

/**
 * Super admin: Impersonate another organization
 */
export async function impersonateOrganization(
  adminSession: DashboardSession,
  targetOrganizationId: string
): Promise<string> {
  if (!adminSession.is_super_admin) {
    throw new Error('FORBIDDEN: Only super admins can impersonate')
  }

  // Get target organization details
  const db = createClient()
  const result = await db.execute(
    `SELECT organization_id, merchant_id 
     FROM square_connections 
     WHERE organization_id = ?
     LIMIT 1`,
    [targetOrganizationId]
  )

  if (result.rows.length === 0) {
    throw new Error('Organization not found')
  }

  const org = result.rows[0]

  // Create impersonation token
  const token = await new SignJWT({
    organization_id: org.organization_id,
    merchant_id: org.merchant_id,
    is_super_admin: true,
    impersonating: targetOrganizationId,
    admin_email: adminSession.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h') // Shorter expiry for impersonation
    .setIssuedAt()
    .sign(JWT_SECRET)

  return token
}

/**
 * Get organization ID for current session (handles impersonation)
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const session = await getSession()
  if (!session) return null

  // If impersonating, use the impersonated org ID
  return session.impersonating || session.organization_id
}

// ============= NEW FUNCTIONS FOR MULTI-ORGANIZATION SUPPORT =============

/**
 * Get current merchant ID from session
 */
export async function getCurrentMerchantId(): Promise<string | null> {
  const session = await getSession()
  return session?.merchant_id || null
}

/**
 * Get ALL organization IDs for the current merchant
 * This is the key function for fetching data across all merchant organizations
 */
export async function getMerchantOrganizationIds(): Promise<string[]> {
  const session = await getSession()
  
  if (!session?.merchant_id) {
    return []
  }

  const db = createClient()
  
  try {
    // Get all organization IDs associated with this merchant
    // Note: SELECT includes created_at to allow ORDER BY (required for DISTINCT)
    const result = await db.execute(
      `SELECT DISTINCT o.id, o.created_at
       FROM organizations o
       WHERE o.square_merchant_id = ?
       AND o.active = 1
       ORDER BY o.created_at ASC`,
      [session.merchant_id]
    )

    return result.rows.map((row: any) => row.id)
  } catch (error) {
    console.error('Error fetching merchant organizations:', error)
    return []
  }
}

/**
 * Get ALL organizations with details for the current merchant
 */
export async function getMerchantOrganizations(): Promise<Array<{id: string, name: string}>> {
  const session = await getSession()
  
  if (!session?.merchant_id) {
    return []
  }

  const db = createClient()
  
  try {
    const result = await db.execute(
      `SELECT o.id, o.name, o.created_at
       FROM organizations o
       WHERE o.square_merchant_id = ?
       AND o.active = 1
       ORDER BY o.created_at ASC`,
      [session.merchant_id]
    )
    
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name || `Organization ${row.id}`
    }))
  } catch (error) {
    console.error('Error fetching merchant organizations with details:', error)
    return []
  }
}

// ============= END NEW FUNCTIONS =============

/**
 * List all organizations (super admin only)
 */
export async function listAllOrganizations() {
  const session = await requireAuth(true)

  const db = createClient()
  const result = await db.execute(`
    SELECT 
      sc.organization_id,
      sc.merchant_id,
      COUNT(DISTINCT d.id) as total_donations,
      SUM(d.amount) as total_amount,
      MAX(d.created_at) as last_donation
    FROM square_connections sc
    LEFT JOIN donations d ON d.organization_id = sc.organization_id
    GROUP BY sc.organization_id, sc.merchant_id
    ORDER BY total_amount DESC
  `)

  return result.rows
}

/**
 * Middleware helper for API routes
 */
export async function withAuth(
  handler: (session: DashboardSession, ...args: any[]) => Promise<Response>,
  requireSuperAdmin = false
) {
  return async (...args: any[]) => {
    try {
      const session = await requireAuth(requireSuperAdmin)
      return handler(session, ...args)
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'FORBIDDEN') {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}