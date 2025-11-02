"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
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
      else if (period === 'all') periodParam = '30days'
      
      const response = await fetch(`/api/dashboard/charts?type=donations_over_time&period=${periodParam}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const result = await response.json()
      
      // Transform API data to chart format
      const chartData = (result.data || []).map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(item.total),
        count: parseInt(item.count),
      }))

      setData(chartData)
    } catch (err: any) {
      console.error('Error fetching chart data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
        <CardDescription className="text-xs sm:text-sm">Daily donation activity</CardDescription>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "amount") {
                    return [`$${value.toFixed(2)}`, "Amount"]
                  }
                  return [value, name]
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}