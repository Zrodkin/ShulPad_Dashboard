"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, TrendingUp, Monitor } from "lucide-react"
import { DonationChart } from "@/components/donation-chart"
import { TopDonorsTable } from "@/components/top-donors-table"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const stats = [
  {
    title: "Total Donations",
    value: "$10,000",
    change: "+10%",
    icon: DollarSign,
    periods: { today: "$500", week: "$3,000", allTime: "$10,000" },
  },
  {
    title: "Active Kiosks",
    value: "5",
    change: "+2%",
    icon: Monitor,
    periods: { today: "2", week: "4", allTime: "5" },
  },
  { title: "Donors", value: "100", change: "+5%", icon: Users, periods: { today: "10", week: "50", allTime: "100" } },
  {
    title: "Average Donation",
    value: "$100",
    change: "+5%",
    icon: TrendingUp,
    periods: { today: "$50", week: "$90", allTime: "$100" },
  },
]

interface DashboardContentProps {
  onDonorClick?: (email: string) => void
}

export function DashboardContent({ onDonorClick }: DashboardContentProps) {
  const [timePeriod, setTimePeriod] = useState<"today" | "week" | "allTime">("allTime")

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-balance">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your donation kiosks.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={timePeriod === "today" ? "default" : "outline"}
            size="sm"
            className="sm:size-default"
            onClick={() => setTimePeriod("today")}
          >
            Today
          </Button>
          <Button
            variant={timePeriod === "week" ? "default" : "outline"}
            size="sm"
            className="sm:size-default"
            onClick={() => setTimePeriod("week")}
          >
            This Week
          </Button>
          <Button
            variant={timePeriod === "allTime" ? "default" : "outline"}
            size="sm"
            className="sm:size-default"
            onClick={() => setTimePeriod("allTime")}
          >
            All Time
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const displayValue = stat.periods ? stat.periods[timePeriod] : stat.value
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{displayValue}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                {stat.periods && (
                  <div className="mt-3 pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-medium text-foreground">{stat.periods.today}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">This Week:</span>
                      <span className="font-medium text-foreground">{stat.periods.week}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">All Time:</span>
                      <span className="font-medium text-foreground">{stat.periods.allTime}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <DonationChart />
        <TopDonorsTable onDonorClick={onDonorClick} />
      </div>
    </div>
  )
}
