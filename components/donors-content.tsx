"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const donors = [
  {
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    totalGiven: 2450,
    donations: 12,
    lastDonation: "2024-01-15",
  },
  {
    name: "Michael Chen",
    email: "m.chen@email.com",
    totalGiven: 1890,
    donations: 8,
    lastDonation: "2024-01-15",
  },
  {
    name: "Emily Rodriguez",
    email: "emily.r@email.com",
    totalGiven: 1650,
    donations: 15,
    lastDonation: "2024-01-14",
  },
  {
    name: "David Kim",
    email: "d.kim@email.com",
    totalGiven: 1420,
    donations: 6,
    lastDonation: "2024-01-14",
  },
  {
    name: "Lisa Anderson",
    email: "lisa.a@email.com",
    totalGiven: 1280,
    donations: 9,
    lastDonation: "2024-01-13",
  },
  {
    name: "Robert Taylor",
    email: "r.taylor@email.com",
    totalGiven: 980,
    donations: 5,
    lastDonation: "2024-01-11",
  },
  {
    name: "Jennifer White",
    email: "j.white@email.com",
    totalGiven: 750,
    donations: 3,
    lastDonation: "2024-01-10",
  },
]

interface DonorsContentProps {
  onViewDonor: (donorEmail: string) => void
}

export function DonorsContent({ onViewDonor }: DonorsContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("totalGiven")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredAndSortedDonors = useMemo(() => {
    let result = [...donors]

    // Search filter
    if (searchQuery !== "") {
      result = result.filter(
        (donor) =>
          donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          donor.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      if (sortBy === "totalGiven") {
        comparison = a.totalGiven - b.totalGiven
      } else if (sortBy === "donations") {
        comparison = a.donations - b.donations
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "lastDonation") {
        comparison = new Date(a.lastDonation).getTime() - new Date(b.lastDonation).getTime()
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [searchQuery, sortBy, sortOrder])

  const handleClearFilters = () => {
    setSearchQuery("")
    setSortBy("totalGiven")
    setSortOrder("desc")
  }

  const hasActiveFilters = searchQuery !== "" || sortBy !== "totalGiven" || sortOrder !== "desc"

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Donors</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your donor relationships and history</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" size="sm">
          <UserPlus className="h-4 w-4" />
          Add Donor
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
                    <SelectItem value="totalGiven">Total Given</SelectItem>
                    <SelectItem value="donations">Number of Donations</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="lastDonation">Last Donation</SelectItem>
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

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedDonors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No donors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedDonors.map((donor) => (
                      <TableRow
                        key={donor.email}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => onViewDonor(donor.email)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {donor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium whitespace-nowrap">{donor.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{donor.email}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          ${donor.totalGiven.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{donor.donations}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{donor.lastDonation}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredAndSortedDonors.length} of {donors.length} donors
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
