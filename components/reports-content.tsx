"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Pie, PieChart, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileDown, FileText, FileSpreadsheet } from "lucide-react"
import { useEffect, useState } from "react"

interface MonthData {
  month: string
  amount: number
}

interface KioskData {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface ReportsData {
  donationsByMonth: MonthData[]
  donationsByKiosk: KioskData[]
  insights: {
    bestPerformingKiosk: {
      name: string
      total: number
    }
    peakTime: string
    growthRate: string
  }
}

export function ReportsContent() {
  const [reportsData, setReportsData] = useState<ReportsData>({
    donationsByMonth: [],
    donationsByKiosk: [],
    insights: {
      bestPerformingKiosk: { name: 'N/A', total: 0 },
      peakTime: 'N/A',
      growthRate: '0',
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch('/api/dashboard/reports')
        if (response.ok) {
          const data = await response.json()
          setReportsData(data)
        }
      } catch (error) {
        console.error('Error fetching reports data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportsData()
  }, [])

  const donationsByMonth = reportsData.donationsByMonth
  const donationsByKiosk = reportsData.donationsByKiosk
  const handleExportCSV = () => {
    const csvData = [
      ["Month", "Amount"],
      ...donationsByMonth.map((item) => [item.month, item.amount]),
      [],
      ["Kiosk", "Total Donations"],
      ...donationsByKiosk.map((item) => [item.name, item.value]),
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

  const handleExportPDF = () => {
    // In a real implementation, you would use a library like jsPDF
    alert("PDF export functionality would be implemented with a library like jsPDF or by generating on the server")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Analyze donation trends and performance metrics
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <FileDown className="h-4 w-4" />
              Generate Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="h-4 w-4" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Donations Over Time</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Monthly donation totals for the past 7 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Loading chart data...</div>
            ) : donationsByMonth.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={donationsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} className="sm:text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Donations by Kiosk</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Distribution of donations across all kiosk locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Loading chart data...</div>
            ) : donationsByKiosk.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <PieChart>
                  <Pie
                    data={donationsByKiosk}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    className="sm:outerRadius-[80]"
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: "10px" }}
                  >
                    {donationsByKiosk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Best Performing Kiosk</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {reportsData.insights.bestPerformingKiosk.name}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  ${reportsData.insights.bestPerformingKiosk.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total donations
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Peak Donation Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {reportsData.insights.peakTime}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Based on last 90 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {parseFloat(reportsData.insights.growthRate) >= 0 ? '+' : ''}{reportsData.insights.growthRate}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Compared to previous 90 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
