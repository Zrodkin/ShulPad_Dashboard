"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const topDonors = [
  { name: "Sarah Johnson", email: "sarah.j@email.com", amount: "$2,450", donations: 12 },
  { name: "Michael Chen", email: "m.chen@email.com", amount: "$1,890", donations: 8 },
  { name: "Emily Rodriguez", email: "emily.r@email.com", amount: "$1,650", donations: 15 },
  { name: "David Kim", email: "d.kim@email.com", amount: "$1,420", donations: 6 },
  { name: "Lisa Anderson", email: "lisa.a@email.com", amount: "$1,280", donations: 9 },
]

interface TopDonorsTableProps {
  onDonorClick?: (email: string) => void
}

export function TopDonorsTable({ onDonorClick }: TopDonorsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Top Donors</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your most generous supporters this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {topDonors.map((donor, index) => (
            <div
              key={donor.email}
              onClick={() => onDonorClick?.(donor.email)}
              className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {donor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{donor.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{donor.email}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-semibold text-foreground">{donor.amount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                  {donor.donations} donations
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
