"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, Filter, Search, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const transactions = [
  {
    id: "TXN-001",
    donor: "Sarah Johnson",
    donorEmail: "sarah.j@email.com",
    amount: 50.0,
    date: "2024-01-15",
    kiosk: "Main Lobby",
    status: "completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-002",
    donor: "Michael Chen",
    donorEmail: "m.chen@email.com",
    amount: 100.0,
    date: "2024-01-15",
    kiosk: "East Wing",
    status: "completed",
    paymentMethod: "Debit Card",
  },
  {
    id: "TXN-003",
    donor: "Emily Rodriguez",
    donorEmail: "emily.r@email.com",
    amount: 25.0,
    date: "2024-01-14",
    kiosk: "Main Lobby",
    status: "completed",
    paymentMethod: "Cash",
  },
  {
    id: "TXN-004",
    donor: "David Kim",
    donorEmail: "d.kim@email.com",
    amount: 75.0,
    date: "2024-01-14",
    kiosk: "West Wing",
    status: "pending",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-005",
    donor: "Lisa Anderson",
    donorEmail: "lisa.a@email.com",
    amount: 150.0,
    date: "2024-01-13",
    kiosk: "Main Lobby",
    status: "completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-006",
    donor: "Anonymous",
    donorEmail: "",
    amount: 30.0,
    date: "2024-01-13",
    kiosk: "East Wing",
    status: "completed",
    paymentMethod: "Cash",
  },
  {
    id: "TXN-007",
    donor: "Sarah Johnson",
    donorEmail: "sarah.j@email.com",
    amount: 200.0,
    date: "2024-01-12",
    kiosk: "Main Lobby",
    status: "completed",
    paymentMethod: "Credit Card",
  },
  {
    id: "TXN-008",
    donor: "Robert Taylor",
    donorEmail: "r.taylor@email.com",
    amount: 45.0,
    date: "2024-01-11",
    kiosk: "West Wing",
    status: "failed",
    paymentMethod: "Credit Card",
  },
]

interface TransactionsContentProps {
  onViewTransaction: (transactionId: string) => void
}

export function TransactionsContent({ onViewTransaction }: TransactionsContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [kioskFilter, setKioskFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const uniqueKiosks = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.kiosk)))
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.kiosk.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter

      // Kiosk filter
      const matchesKiosk = kioskFilter === "all" || transaction.kiosk === kioskFilter

      // Date filter
      let matchesDate = true
      if (dateFilter !== "all") {
        const transactionDate = new Date(transaction.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateFilter === "today") {
          matchesDate = transactionDate >= today
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = transactionDate >= weekAgo
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          matchesDate = transactionDate >= monthAgo
        }
      }

      return matchesSearch && matchesStatus && matchesKiosk && matchesDate
    })
  }, [searchQuery, statusFilter, kioskFilter, dateFilter])

  const handleExport = () => {
    const headers = ["Transaction ID", "Donor", "Amount", "Date", "Kiosk", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((t) =>
        [t.id, t.donor, `$${t.amount.toFixed(2)}`, t.date, t.kiosk, t.status].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setKioskFilter("all")
    setDateFilter("all")
  }

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || kioskFilter !== "all" || dateFilter !== "all"

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

                <Select value={kioskFilter} onValueChange={setKioskFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Kiosk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Kiosks</SelectItem>
                    {uniqueKiosks.map((kiosk) => (
                      <SelectItem key={kiosk} value={kiosk}>
                        {kiosk}
                      </SelectItem>
                    ))}
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
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="whitespace-nowrap">Donor</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Kiosk</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.id}
                        className="cursor-pointer hover:bg-accent/50"
                        onClick={() => onViewTransaction(transaction.id)}
                      >
                        <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                          {transaction.id}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{transaction.donor}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{transaction.date}</TableCell>
                        <TableCell className="whitespace-nowrap">{transaction.kiosk}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
