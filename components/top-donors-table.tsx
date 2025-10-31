"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface TopDonor {
  donor_identifier: string
  donor_name: string
  donor_email: string | null
  donation_count: number
  total_donated: string
}

interface TopDonorsTableProps {
  onDonorClick?: (email: string) => void
  period?: "today" | "week" | "all"
}

export function TopDonorsTable({ onDonorClick, period = "all" }: TopDonorsTableProps) {
  const [topDonors, setTopDonors] = useState<TopDonor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopDonors()
  }, [period])

  const fetchTopDonors = async () => {
    try {
      setLoading(true)
      setError(null)

      // Map period to days for API
      let periodParam = '30days'
      if (period === 'today') periodParam = '7days'
      else if (period === 'week') periodParam = '7days'
      
      const response = await fetch(`/api/dashboard/charts?type=top_donors&period=${periodParam}&limit=5`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch top donors')
      }

      const data = await response.json()
      setTopDonors(data.data || [])
    } catch (err: any) {
      console.error('Error fetching top donors:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Top Donors</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Top Donors</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your most generous supporters</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : topDonors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No donations yet
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {topDonors.map((donor, index) => (
              <div
                key={donor.donor_identifier || `anon-${index}`}
                onClick={() => onDonorClick?.(donor.donor_identifier)}
                className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {donor.donor_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{donor.donor_name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {donor.donor_email || 'Anonymous'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground">${donor.total_donated}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    {donor.donation_count} donation{donor.donation_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}