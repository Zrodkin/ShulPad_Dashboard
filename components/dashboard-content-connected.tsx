// components/dashboard-content-connected.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar } from "lucide-react"
import { DonationChart } from "@/components/donation-chart"
import { TopDonorsTable } from "@/components/top-donors-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  total_donations: number
  total_amount: string
  average_donation: string
  today_donations: number
  unique_donors: number
  recurring_donations: number
  receipts_sent: number
}

interface DashboardContentProps {
  onDonorClick?: (email: string) => void
}

export function DashboardContentConnected({ onDonorClick }: DashboardContentProps) {
  const [timePeriod, setTimePeriod] = useState<"today" | "week" | "all">("all")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [changes, setChanges] = useState<{ amount_change: number; count_change: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [timePeriod])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/dashboard/stats?period=${timePeriod}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/dashboard/login'
          return
        }
        throw new Error('Failed to fetch statistics')
      }

      const data = await response.json()
      setStats(data.stats)
      setChanges(data.changes)
    } catch (err: any) {
      console.error('Error fetching stats:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
        <Button onClick={fetchStats}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-balance">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your donations.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={timePeriod === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimePeriod("today")}
            disabled={loading}
          >
            Today
          </Button>
          <Button
            variant={timePeriod === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimePeriod("week")}
            disabled={loading}
          >
            This Week
          </Button>
          <Button
            variant={timePeriod === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimePeriod("all")}
            disabled={loading}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">${stats.total_amount}</div>
                {changes && timePeriod !== 'all' && (
                  <p className={`text-xs mt-1 ${changes.amount_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatChange(changes.amount_change)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Donors</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{stats.unique_donors}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique donors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Donations</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{stats.today_donations}</div>
                <p className="text-xs text-muted-foreground mt-1">Donations today</p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <DonationChart period={timePeriod} />
        <TopDonorsTable onDonorClick={onDonorClick} period={timePeriod} />
      </div>

      {/* Additional Stats Row */}
      {!loading && stats && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recurring Donations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recurring_donations}</div>
              <p className="text-xs text-muted-foreground mt-1">Monthly partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Receipts Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.receipts_sent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_donations > 0 
                  ? `${((stats.receipts_sent / stats.total_donations) * 100).toFixed(0)}% of donations`
                  : 'No donations yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_donations}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed donations</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}