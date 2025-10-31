"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Mail, MapPin, CreditCard, Calendar, User, Loader2, Edit, Check, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Transaction {
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

interface TransactionDetailContentProps {
  transactionId: string
  onBack: () => void
  onNavigateToDonor: (donorEmail: string) => void
}

interface Donor {
  donor_email: string | null
  donor_name: string | null
  donation_count: number
  total_donated: number
}

export function TransactionDetailContent({ transactionId, onBack, onNavigateToDonor }: TransactionDetailContentProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState<'existing' | 'new'>('existing')
  const [donors, setDonors] = useState<Donor[]>([])
  const [selectedDonorEmail, setSelectedDonorEmail] = useState('')
  const [newDonorName, setNewDonorName] = useState('')
  const [newDonorEmail, setNewDonorEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTransaction()
  }, [transactionId])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/donations/${transactionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transaction')
      }

      const data = await response.json()
      setTransaction(data.donation)
    } catch (err: any) {
      console.error('Error fetching transaction:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDonors = async () => {
    try {
      const response = await fetch('/api/dashboard/donors?limit=100')
      if (!response.ok) throw new Error('Failed to fetch donors')
      const data = await response.json()
      setDonors(data.donors || [])
    } catch (err) {
      console.error('Error fetching donors:', err)
    }
  }

  const handleEditDonor = () => {
    setEditDialogOpen(true)
    fetchDonors()
  }

  const handleSaveDonorUpdate = async () => {
    if (!transaction) return

    setSaving(true)
    try {
      let donor_email: string | null = null
      let donor_name: string | null = null

      if (editMode === 'existing') {
        // Find the selected donor
        const selectedDonor = donors.find(d =>
          (d.donor_email || `name_without_email_${d.donor_name}`) === selectedDonorEmail
        )
        if (selectedDonor) {
          donor_email = selectedDonor.donor_email
          donor_name = selectedDonor.donor_name
        }
      } else {
        // Use new donor info
        donor_email = newDonorEmail || null
        donor_name = newDonorName
      }

      const response = await fetch(`/api/dashboard/donations/${transaction.id}/update-donor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_email, donor_name, notes })
      })

      if (!response.ok) throw new Error('Failed to update donor')

      const data = await response.json()
      setTransaction(data.transaction)
      setEditDialogOpen(false)
      setNotes('')
      setNewDonorName('')
      setNewDonorEmail('')
      setSelectedDonorEmail('')
    } catch (err) {
      console.error('Error updating donor:', err)
      alert('Failed to update donor information')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadReceipt = async () => {
    if (!transaction?.payment_id) return

    try {
      const response = await fetch(`/api/dashboard/receipts/${transaction.id}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${transaction.payment_id}.pdf`
      a.click()
    } catch (err) {
      console.error('Failed to download receipt:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Error loading transaction: {error || 'Transaction not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
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
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {transaction.payment_id || `Transaction #${transaction.id}`}
            </p>
          </div>
        </div>
        {transaction.receipt_sent && (
          <Button onClick={handleDownloadReceipt} className="gap-2 w-full sm:w-auto" size="sm">
            <Download className="h-4 w-4" />
            Download Receipt
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Amount Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Transaction Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-foreground">
                  ${transaction.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{transaction.currency}</p>
              </div>
              <Badge variant={transaction.payment_status === 'COMPLETED' ? 'default' : 'secondary'}>
                {transaction.payment_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Donor Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Donor Information
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleEditDonor} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-base font-medium text-foreground">
                  {transaction.donor_name || 'Anonymous'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-base font-medium text-foreground">
                  {transaction.donor_email || 'Not provided'}
                </p>
              </div>
            </div>
            {(transaction.donor_email || transaction.donor_name) && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Use email if available, otherwise create identifier from name
                    const identifier = transaction.donor_email || `name_without_email_${transaction.donor_name}`
                    onNavigateToDonor(identifier)
                  }}
                  className="w-full"
                >
                  View Donor Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-base font-medium text-foreground">{formatDate(transaction.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="text-base font-medium text-foreground">{formatTime(transaction.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receipt Sent</p>
              <Badge variant={transaction.receipt_sent ? 'default' : 'secondary'}>
                {transaction.receipt_sent ? 'Yes' : 'No'}
              </Badge>
            </div>
            {transaction.is_recurring && (
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">Recurring</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <p className="text-sm font-mono text-foreground break-all">
                {transaction.payment_id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="text-sm font-mono text-foreground break-all">
                {transaction.square_order_id || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transaction ID</p>
              <p className="text-sm font-mono text-foreground">#{transaction.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Donor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Donor Information</DialogTitle>
            <DialogDescription>
              Associate this transaction with an existing donor or create a new donor profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>Select Option</Label>
              <Select value={editMode} onValueChange={(value: 'existing' | 'new') => setEditMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Associate with Existing Donor</SelectItem>
                  <SelectItem value="new">Create New Donor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editMode === 'existing' ? (
              /* Existing Donor Selection */
              <div className="space-y-2">
                <Label htmlFor="donor">Select Donor</Label>
                <Select value={selectedDonorEmail} onValueChange={setSelectedDonorEmail}>
                  <SelectTrigger id="donor">
                    <SelectValue placeholder="Choose a donor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {donors.map((donor) => {
                      const identifier = donor.donor_email || `name_without_email_${donor.donor_name}`
                      const displayName = donor.donor_name || 'Anonymous'
                      const displayEmail = donor.donor_email || 'No email'
                      return (
                        <SelectItem key={identifier} value={identifier}>
                          <div className="flex flex-col">
                            <span className="font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {displayEmail} • {donor.donation_count} donations • ${Number(donor.total_donated).toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* New Donor Form */
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Donor Name *</Label>
                  <Input
                    id="new-name"
                    placeholder="Enter donor name"
                    value={newDonorName}
                    onChange={(e) => setNewDonorName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Donor Email (optional)</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter donor email"
                    value={newDonorEmail}
                    onChange={(e) => setNewDonorEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveDonorUpdate} disabled={saving || (editMode === 'existing' && !selectedDonorEmail) || (editMode === 'new' && !newDonorName)}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}