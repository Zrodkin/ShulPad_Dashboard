"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
  { date: "Jan 1", amount: 1200 },
  { date: "Jan 8", amount: 1800 },
  { date: "Jan 15", amount: 1500 },
  { date: "Jan 22", amount: 2200 },
  { date: "Jan 29", amount: 2800 },
  { date: "Feb 5", amount: 2400 },
  { date: "Feb 12", amount: 3200 },
]

export function DonationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Donations Over Time</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Daily donation totals for the past 7 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <LineChart data={data}>
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
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
