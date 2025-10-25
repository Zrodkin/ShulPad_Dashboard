// app/dashboard/admin/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, ArrowLeft, ShieldCheck } from "lucide-react"

interface Organization {
  organization_id: string
  merchant_id: string
  total_donations: number
  total_amount: string
  unique_donors: number
  last_donation_at: string | null
  first_donation_at: string | null
}

interface Session {
  is_super_admin: boolean
  impersonating?: string
  email?: string
}

export default function AdminDashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      // Check if user is super admin
      const sessionRes = await fetch('/api/dashboard/auth/session')
      if (!sessionRes.ok) {
        router.push('/dashboard/login')
        return
      }

      const sessionData = await sessionRes.json()
      setSession(sessionData)

      if (!sessionData.is_super_admin) {
        router.push('/dashboard')
        return
      }

      // Load organizations
      await fetchOrganizations()
    } catch (err: any) {
      console.error('Access check error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/admin/organizations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data.organizations)
    } catch (err: any) {
      console.error('Error fetching organizations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (organizationId: string) => {
    try {
      setImpersonating(true)
      setError(null)

      const response = await fetch('/api/dashboard/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to impersonate')
      }

      // Redirect to main dashboard (now viewing as this org)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Impersonation error:', err)
      setError(err.message)
      setImpersonating(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">Super Admin Panel</CardTitle>
                <CardDescription>
                  Manage and view all organizations • Logged in as: {session?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations ({organizations.length})</CardTitle>
            <CardDescription>
              Click "View Dashboard" to impersonate an organization and see their data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization ID</TableHead>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead className="text-right">Total Donations</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Unique Donors</TableHead>
                    <TableHead>First Donation</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((org) => (
                      <TableRow key={org.organization_id}>
                        <TableCell className="font-mono text-sm">
                          {org.organization_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {org.merchant_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{org.total_donations}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${org.total_amount}
                        </TableCell>
                        <TableCell className="text-right">{org.unique_donors}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(org.first_donation_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(org.last_donation_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(org.organization_id)}
                            disabled={impersonating}
                          >
                            {impersonating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                View Dashboard
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Donations (All Orgs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizations.reduce((sum, org) => sum + org.total_donations, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Amount (All Orgs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${organizations
                  .reduce((sum, org) => sum + parseFloat(org.total_amount), 0)
                  .toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}