"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface TopDonor {
  donor_name: string
  donor_email: string | null
  donation_count: number
  total_donated: string
}

interface RecentDonation {
  id: string
  donor_name: string
  donor_email: string | null
  amount: string
  created_at: string
}

interface DonorsDonationsToggleProps {
  onDonorClick?: (email: string) => void
  period?: "today" | "week" | "all"
}

export function DonorsDonationsToggle({ onDonorClick, period = "all" }: DonorsDonationsToggleProps) {
  const [mode, setMode] = useState<"top_donors" | "recent_donations">("top_donors")
  const [topDonors, setTopDonors] = useState<TopDonor[]>([])
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === "top_donors") {
      fetchTopDonors()
    } else {
      fetchRecentDonations()
    }
  }, [period, mode])

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

  const fetchRecentDonations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Map period to days for API
      let periodParam = '30days'
      if (period === 'today') periodParam = '7days'
      else if (period === 'week') periodParam = '7days'

      const response = await fetch(`/api/dashboard/charts?type=recent_donations&period=${periodParam}&limit=5`)

      if (!response.ok) {
        throw new Error('Failed to fetch recent donations')
      }

      const data = await response.json()
      setRecentDonations(data.data || [])
    } catch (err: any) {
      console.error('Error fetching recent donations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {mode === "top_donors" ? "Top Donors" : "Recent Donations"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">
              {mode === "top_donors" ? "Top Donors" : "Recent Donations"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {mode === "top_donors" ? "Your most generous supporters" : "Latest donation activity"}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={mode === "top_donors" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("top_donors")}
            >
              Top
            </Button>
            <Button
              variant={mode === "recent_donations" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("recent_donations")}
            >
              Recent
            </Button>
          </div>
        </div>
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
        ) : mode === "top_donors" ? (
          topDonors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No donations yet
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {topDonors.map((donor, index) => (
                <div
                  key={donor.donor_email || `anon-${index}`}
                  onClick={() => donor.donor_email && onDonorClick?.(donor.donor_email)}
                  className={`flex items-center gap-3 sm:gap-4 ${donor.donor_email ? 'cursor-pointer hover:bg-accent/50' : ''} -mx-2 px-2 py-2 rounded-lg transition-colors`}
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
          )
        ) : (
          recentDonations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No donations yet
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentDonations.map((donation, index) => (
                <div
                  key={donation.id}
                  onClick={() => donation.donor_email && onDonorClick?.(donation.donor_email)}
                  className={`flex items-center gap-3 sm:gap-4 ${donation.donor_email ? 'cursor-pointer hover:bg-accent/50' : ''} -mx-2 px-2 py-2 rounded-lg transition-colors`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {donation.donor_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{donation.donor_name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {formatDate(donation.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">${donation.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
