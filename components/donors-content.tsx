"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DuplicateDonorsDialog } from "./duplicate-donors-dialog"

interface Donor {
  donor_email: string | null
  donor_name: string
  donor_identifier: string
  is_anonymous: boolean
  donation_count: number
  total_donated: string
  average_donation: string
  first_donation: string
  last_donation: string
  receipts_sent: number
  recurring_donations: number
}

interface DonorsContentProps {
  onViewDonor: (donorEmail: string) => void
}

export function DonorsContent({ onViewDonor }: DonorsContentProps) {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("total_donated")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false)

  useEffect(() => {
    fetchDonors()
  }, [page, sortBy, sortOrder, searchQuery])

  const fetchDonors = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        sort_by: sortBy,
        sort_order: sortOrder.toUpperCase(),
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/dashboard/donors?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/dashboard/login'
          return
        }
        throw new Error('Failed to fetch donors')
      }

      const data = await response.json()
      setDonors(data.donors)
      setTotalPages(data.pagination.total_pages)
      setTotalCount(data.pagination.total_count)
    } catch (err: any) {
      console.error('Error fetching donors:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Error loading donors: {error}</p>
        <Button onClick={fetchDonors}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Donors</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your donor relationships and history</p>
        </div>
        <Button onClick={() => setShowDuplicatesDialog(true)} variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Manage Duplicates
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search donors by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex gap-2 items-center flex-1">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_donated">Total Given</SelectItem>
                    <SelectItem value="donation_count">Number of Donations</SelectItem>
                    <SelectItem value="donor_name">Name</SelectItem>
                    <SelectItem value="last_donation">Last Donation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={sortOrder === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("desc")}
                >
                  High to Low
                </Button>
                <Button
                  variant={sortOrder === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("asc")}
                >
                  Low to High
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No donors found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Donor</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Total Given</TableHead>
                        <TableHead className="whitespace-nowrap">Donations</TableHead>
                        <TableHead className="whitespace-nowrap">Last Donation</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donors.map((donor, idx) => (
                        <TableRow
                          key={donor.donor_identifier}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => onViewDonor(donor.donor_identifier)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                  {donor.donor_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium whitespace-nowrap">{donor.donor_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {donor.donor_email || 'Not provided'}
                          </TableCell>
                          <TableCell className="font-semibold whitespace-nowrap">
                            ${parseFloat(donor.total_donated).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{donor.donation_count}</TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(donor.last_donation)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewDonor(donor.donor_identifier)
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DuplicateDonorsDialog
        open={showDuplicatesDialog}
        onOpenChange={setShowDuplicatesDialog}
        onMergeComplete={fetchDonors}
      />
    </div>
  )
}