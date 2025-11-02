"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartData {
  date: string
  count: number
  total: string
}

interface DonationChartProps {
  period?: "today" | "week" | "all"
}

export function DonationChart({ period = "all" }: DonationChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMonthlyView, setIsMonthlyView] = useState(false)

  useEffect(() => {
    fetchChartData()
  }, [period])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Map period to API parameter
      let periodParam = '30days'
      if (period === 'today') periodParam = '7days'
      else if (period === 'week') periodParam = '7days'
      else if (period === 'all') periodParam = 'all'

      const response = await fetch(`/api/dashboard/charts?type=donations_over_time&period=${periodParam}`)

      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const result = await response.json()
      const rawData = result.data || []

      // If there are more than 30 data points, group by month
      let chartData
      if (rawData.length > 30) {
        chartData = groupByMonth(rawData)
        setIsMonthlyView(true)
      } else {
        // Transform API data to chart format with daily view
        chartData = rawData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: parseFloat(item.total),
          count: parseInt(item.count),
        }))
        setIsMonthlyView(false)
      }

      setData(chartData)
    } catch (err: any) {
      console.error('Error fetching chart data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupByMonth = (data: any[]) => {
    // Group data by month
    const monthlyData: { [key: string]: { amount: number; count: number } } = {}

    data.forEach((item: any) => {
      const date = new Date(item.date)
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 }
      }

      monthlyData[monthKey].amount += parseFloat(item.total)
      monthlyData[monthKey].count += parseInt(item.count)
    })

    // Convert to array format for chart
    return Object.entries(monthlyData)
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => {
        // Sort chronologically
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Donations Over Time</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Donations Over Time</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {isMonthlyView ? 'Monthly donation activity' : 'Daily donation activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            No donation data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}