"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar, FileDown, TrendingUp, Users, DollarSign, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Donation {
  id: number
  amount: number
  currency: string
  donor_name: string | null
  donor_email: string | null
  payment_id: string | null
  organization_name: string | null
  payment_status: string
  created_at: string
}

interface DailyData {
  date: string
  amount: number
  count: number
}

export function ReportsContent() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)

  // Date range filters
  const [dateRange, setDateRange] = useState<string>("30")
  const [customStartDate, setCustomStartDate] = useState<string>("")
  const [customEndDate, setCustomEndDate] = useState<string>("")

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    todayDonations: 0,
    uniqueDonors: 0
  })

  useEffect(() => {
    fetchReportsData()
  }, [dateRange, customStartDate, customEndDate])

  const getDateRange = () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (dateRange === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      }
    }

    const days = parseInt(dateRange)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }
  }

  const fetchReportsData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()

      if (!startDate || !endDate) return

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: '1000',
        sort_by: 'created_at',
        sort_order: 'DESC'
      })

      const response = await fetch(`/api/dashboard/donations?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDonations(data.donations)

        // Calculate stats
        const total = data.donations.reduce((sum: number, d: Donation) => sum + d.amount, 0)
        const uniqueEmails = new Set(data.donations.map((d: Donation) => d.donor_email).filter(Boolean))

        // Calculate today's donations
        const todayDate = new Date().toISOString().split('T')[0]
        const todayCount = data.donations.filter((d: Donation) => {
          const donationDate = new Date(d.created_at).toISOString().split('T')[0]
          return donationDate === todayDate
        }).length

        setStats({
          totalAmount: total,
          totalCount: data.donations.length,
          averageAmount: data.donations.length > 0 ? total / data.donations.length : 0,
          todayDonations: todayCount,
          uniqueDonors: uniqueEmails.size
        })

        // Process daily data for chart
        const dailyMap = new Map<string, { amount: number, count: number }>()
        data.donations.forEach((d: Donation) => {
          const date = new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const existing = dailyMap.get(date) || { amount: 0, count: 0 }
          dailyMap.set(date, {
            amount: existing.amount + d.amount,
            count: existing.count + 1
          })
        })

        const dailyArray = Array.from(dailyMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .reverse()
          .slice(-30) // Show last 30 days max

        setDailyData(dailyArray)
      }
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const csvData = [
      ["Date", "Donor Name", "Donor Email", "Amount", "Organization", "Payment ID"],
      ...donations.map((d) => [
        new Date(d.created_at).toLocaleDateString(),
        d.donor_name || 'Anonymous',
        d.donor_email || 'N/A',
        d.amount.toFixed(2),
        d.organization_name || 'N/A',
        d.payment_id || d.id.toString()
      ]),
      [],
      ["Summary"],
      ["Total Amount", stats.totalAmount.toFixed(2)],
      ["Total Donations", stats.totalCount.toString()],
      ["Today's Donations", stats.todayDonations.toString()],
      ["Unique Donors", stats.uniqueDonors.toString()],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shulpad-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View and analyze donation data with custom date ranges
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2 w-full sm:w-auto">
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    placeholder="End Date"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${loading ? '...' : stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalCount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Number of donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Donations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.todayDonations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Donations today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.uniqueDonors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Individual contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Donations Over Time</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Daily donation totals for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} key={`${dateRange}-${customStartDate}-${customEndDate}-${dailyData.length}`}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Donation Details</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Complete list of donations in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading report data...</div>
          ) : donations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No donations found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Donor</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Organization</TableHead>
                      <TableHead className="whitespace-nowrap">Payment ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.slice(0, 100).map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatDate(donation.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {donation.donor_name || 'Anonymous'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {donation.donor_email || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          ${donation.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {donation.organization_name || 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {donation.payment_id?.slice(-8) || `#${donation.id}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {donations.length > 100 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing first 100 of {donations.length} donations. Export to CSV to see all.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
