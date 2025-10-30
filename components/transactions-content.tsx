"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Filter, Search, X, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface Donation {
  id: number
  amount: number
  currency: string
  donor_name: string | null
  donor_email: string | null
  payment_id: string | null
  square_order_id: string | null
  payment_status: string
  receipt_sent: boolean
  is_recurring: boolean
  created_at: string
  updated_at: string
}

interface TransactionsContentProps {
  onViewTransaction: (transactionId: string) => void
}

export function TransactionsContent({ onViewTransaction }: TransactionsContentProps) {
  const [transactions, setTransactions] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchTransactions()
  }, [page, statusFilter, dateFilter, searchQuery])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      if (statusFilter !== 'all') {
        // Map 'completed' to 'COMPLETED', etc.
        params.append('payment_status', statusFilter.toUpperCase())
      }

      // Handle date filters
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dateFilter === 'today') {
        params.append('start_date', today.toISOString().split('T')[0])
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        params.append('start_date', weekAgo.toISOString().split('T')[0])
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        params.append('start_date', monthAgo.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/dashboard/donations?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/dashboard/login'
          return
        }
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      setTransactions(data.donations)
      setTotalPages(data.pagination.total_pages)
      setTotalCount(data.pagination.total_count)
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ format: 'csv' })
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('payment_status', statusFilter.toUpperCase())
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dateFilter === 'today') {
        params.append('start_date', today.toISOString().split('T')[0])
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        params.append('start_date', weekAgo.toISOString().split('T')[0])
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        params.append('start_date', monthAgo.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/dashboard/export?${params.toString()}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDateFilter("all")
  }

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || dateFilter !== "all"

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    if (status === 'COMPLETED') return 'default'
    if (status === 'PENDING') return 'secondary'
    return 'destructive'
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Error loading transactions: {error}</p>
        <Button onClick={fetchTransactions}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">View and manage all donation transactions</p>
        </div>
        <Button onClick={handleExport} className="gap-2 w-full sm:w-auto" size="sm">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">ID</TableHead>
                        <TableHead className="whitespace-nowrap">Donor</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.payment_id || `donation-${transaction.id}-${transaction.created_at}`} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                            {transaction.payment_id?.slice(-8) || `#${transaction.id}`}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div>
                              <div className="font-medium">
                                {transaction.donor_name || 'Anonymous'}
                              </div>
                              {transaction.donor_email && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.donor_email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold whitespace-nowrap">
                            ${transaction.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(transaction.payment_status)}>
                              {transaction.payment_status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewTransaction(transaction.payment_id || transaction.id.toString())
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
    </div>
  )
}