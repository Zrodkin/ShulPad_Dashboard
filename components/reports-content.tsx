"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Pie, PieChart, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileDown, FileText, FileSpreadsheet } from "lucide-react"

const donationsByMonth = [
  { month: "Jul", amount: 3200 },
  { month: "Aug", amount: 4100 },
  { month: "Sep", amount: 3800 },
  { month: "Oct", amount: 4500 },
  { month: "Nov", amount: 5200 },
  { month: "Dec", amount: 6100 },
  { month: "Jan", amount: 5800 },
]

const donationsByKiosk = [
  { name: "Main Lobby", value: 12500, color: "hsl(var(--chart-1))" },
  { name: "East Wing", value: 8900, color: "hsl(var(--chart-2))" },
  { name: "West Wing", value: 7200, color: "hsl(var(--chart-3))" },
  { name: "North Entrance", value: 6800, color: "hsl(var(--chart-4))" },
  { name: "South Hall", value: 5400, color: "hsl(var(--chart-5))" },
]

export function ReportsContent() {
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
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={donationsByKiosk}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Best Performing Kiosk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-semibold text-foreground">Main Lobby</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">$12,500 total donations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Peak Donation Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-semibold text-foreground">2-4 PM</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Weekdays see highest activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-semibold text-foreground">+24.5%</div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Compared to last quarter</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
