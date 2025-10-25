"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Mail, MapPin, CreditCard, Calendar, User } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Mock data - in real app this would come from API/database
const getTransactionById = (id: string) => {
  const transactions = [
    {
      id: "TXN-001",
      donor: "Sarah Johnson",
      donorId: "DNR-001",
      donorEmail: "sarah.j@email.com",
      amount: 50.0,
      date: "2024-01-15",
      time: "10:32 AM",
      kiosk: "Main Lobby",
      kioskLocation: "123 Main Street, Building A",
      status: "completed",
      paymentMethod: "Credit Card",
      cardLast4: "4242",
      receiptNumber: "RCP-001-2024",
      campaign: "General Fund",
      notes: "Monthly recurring donation",
    },
    {
      id: "TXN-002",
      donor: "Michael Chen",
      donorId: "DNR-002",
      donorEmail: "m.chen@email.com",
      amount: 100.0,
      date: "2024-01-15",
      time: "2:15 PM",
      kiosk: "East Wing",
      kioskLocation: "456 East Ave, Floor 2",
      status: "completed",
      paymentMethod: "Debit Card",
      cardLast4: "5555",
      receiptNumber: "RCP-002-2024",
      campaign: "Building Fund",
      notes: "",
    },
    {
      id: "TXN-003",
      donor: "Emily Rodriguez",
      donorId: "DNR-003",
      donorEmail: "emily.r@email.com",
      amount: 25.0,
      date: "2024-01-14",
      time: "9:45 AM",
      kiosk: "Main Lobby",
      kioskLocation: "123 Main Street, Building A",
      status: "completed",
      paymentMethod: "Cash",
      cardLast4: "",
      receiptNumber: "RCP-003-2024",
      campaign: "General Fund",
      notes: "",
    },
  ]

  return transactions.find((t) => t.id === id) || transactions[0]
}

interface TransactionDetailContentProps {
  transactionId: string
  onBack: () => void
  onNavigateToDonor: (donorId: string) => void
}

export function TransactionDetailContent({ transactionId, onBack, onNavigateToDonor }: TransactionDetailContentProps) {
  const transaction = getTransactionById(transactionId)

  const handleDownloadReceipt = () => {
    // In real app, this would generate/download actual receipt
    alert(`Downloading receipt ${transaction.receiptNumber}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Transaction Details</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{transaction.id}</p>
          </div>
        </div>
        <Button onClick={handleDownloadReceipt} className="gap-2 w-full sm:w-auto" size="sm">
          <Download className="h-4 w-4" />
          Download Receipt
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-2xl font-bold text-primary">${transaction.amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
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
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Receipt Number</span>
              <span className="font-mono text-sm">{transaction.receiptNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Campaign</span>
              <span className="font-medium">{transaction.campaign}</span>
            </div>
          </CardContent>
        </Card>

        {/* Donor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Donor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Name</p>
                <button
                  onClick={() => onNavigateToDonor(transaction.donorId)}
                  className="font-medium text-primary hover:underline focus:outline-none focus:underline text-left"
                >
                  {transaction.donor}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{transaction.donorEmail || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{transaction.paymentMethod}</p>
                {transaction.cardLast4 && (
                  <p className="text-sm text-muted-foreground mt-1">Card ending in {transaction.cardLast4}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {transaction.date} at {transaction.time}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kiosk Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kiosk Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{transaction.kiosk}</p>
                <p className="text-sm text-muted-foreground mt-1">{transaction.kioskLocation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {transaction.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{transaction.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
