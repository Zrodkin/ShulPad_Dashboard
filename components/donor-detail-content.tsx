"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Calendar, DollarSign, TrendingUp, Loader2, Edit, History, RotateCcw, AlertCircle, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

interface DonationHistory {
  id: number
  amount: number
  currency: string
  payment_id: string | null
  square_order_id: string | null
  is_recurring: boolean
  is_custom_amount: boolean
  donation_type: string | null
  receipt_sent: boolean
  created_at: string
}

interface Donor {
  email: string
  name: string
  donation_count: number
  total_donated: string
  average_donation: string
  first_donation: string
  last_donation: string
  receipts_sent: number
  recurring_donations: number
}

interface DonorChange {
  id: number
  old_email: string | null
  old_name: string | null
  new_email: string | null
  new_name: string | null
  change_type: string
  affected_transaction_count: number
  changed_by: string
  changed_at: string
  is_reverted: boolean
  reverted_at: string | null
  notes: string | null
}

interface DonorDetailContentProps {
  donorEmail: string
  onBack: () => void
  onViewTransaction?: (transactionId: string) => void
  onDonorUpdated?: (newDonorIdentifier: string) => void
}

export function DonorDetailContent({ donorEmail, onBack, onViewTransaction, onDonorUpdated }: DonorDetailContentProps) {
  const [donor, setDonor] = useState<Donor | null>(null)
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([])
  const [changeHistory, setChangeHistory] = useState<DonorChange[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedEmail, setEditedEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [reverting, setReverting] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchDonorDetails()
  }, [donorEmail])

  const fetchDonorDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/donors/${encodeURIComponent(donorEmail)}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch donor details')
      }

      const data = await response.json()
      console.log('Fetched donor data:', data.donor)
      setDonor(data.donor)
      setDonationHistory(data.donation_history)

      // Fetch change history
      fetchChangeHistory()
    } catch (err: any) {
      console.error('Error fetching donor:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchChangeHistory = async () => {
    try {
      const response = await fetch(`/api/dashboard/donors/${encodeURIComponent(donorEmail)}/history`)
      if (response.ok) {
        const data = await response.json()
        setChangeHistory(data.history || [])
      }
    } catch (err) {
      console.error('Error fetching change history:', err)
    }
  }

  const handleEditClick = () => {
    if (donor) {
      setEditedName(donor.name)
      setEditedEmail(donor.email)
      setNotes('')
      setEditDialogOpen(true)
    }
  }

  const handleEditSubmit = () => {
    setEditDialogOpen(false)
    setConfirmDialogOpen(true)
  }

  const handleConfirmEdit = async () => {
    if (!donor) return

    setSaving(true)
    try {
      const response = await fetch(`/api/dashboard/donors/${encodeURIComponent(donorEmail)}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: editedEmail || null,
          new_name: editedName,
          notes
        })
      })

      if (!response.ok) throw new Error('Failed to update donor')

      const data = await response.json()
      console.log('Update response:', data)

      // Construct new donor identifier (email or name_without_email_<name>)
      const newDonorIdentifier = data.new_email || `name_without_email_${data.new_name}`
      console.log('Old identifier:', donorEmail)
      console.log('New identifier:', newDonorIdentifier)

      // Check if the identifier changed
      if (newDonorIdentifier === donorEmail) {
        // Identifier hasn't changed (e.g., only name was updated), just refetch data
        console.log('Identifier unchanged, refetching data...')
        await fetchDonorDetails()
        console.log('Data refetched successfully')
      } else {
        // Identifier changed, navigate to the new URL
        console.log('Identifier changed, navigating to new URL...')
        if (onDonorUpdated) {
          onDonorUpdated(newDonorIdentifier)
        } else {
          // Fallback to direct navigation if callback not provided
          window.location.href = `/dashboard/donors/${encodeURIComponent(newDonorIdentifier)}`
        }
      }
    } catch (err) {
      console.error('Error updating donor:', err)
      alert('Failed to update donor information')
    } finally {
      setSaving(false)
      setConfirmDialogOpen(false)
    }
  }

  const handleRevertChange = async (changeId: number) => {
    if (!confirm('Are you sure you want to revert this change? This will update all affected transactions.')) {
      return
    }

    setReverting(changeId)
    try {
      const response = await fetch(`/api/dashboard/donors/changes/${changeId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Reverted via donor profile' })
      })

      if (!response.ok) throw new Error('Failed to revert change')

      // Refresh data
      fetchDonorDetails()
      alert('Change reverted successfully')
    } catch (err) {
      console.error('Error reverting change:', err)
      alert('Failed to revert change')
    } finally {
      setReverting(null)
    }
  }

  const handleDeleteChange = async (changeId: number) => {
    if (!confirm('Are you sure you want to delete this change record? This action cannot be undone and will permanently remove this history entry.')) {
      return
    }

    setDeleting(changeId)
    try {
      const response = await fetch(`/api/dashboard/donors/changes/${changeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete change record')

      // Refresh data
      fetchChangeHistory()
      alert('Change record deleted successfully')
    } catch (err) {
      console.error('Error deleting change record:', err)
      alert('Failed to delete change record')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  if (error || !donor) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">Error loading donor: {error || 'Donor not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = donor.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Donor Profile</h1>
      </div>

      {/* Donor Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-foreground">{donor.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{donor.email}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {donor.recurring_donations > 0 && (
                  <Badge variant="secondary">Recurring Donor</Badge>
                )}
                {parseFloat(donor.total_donated) >= 1000 && (
                  <Badge variant="default">Major Donor</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleEditClick} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Information
              </Button>
              {changeHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)} className="gap-2">
                  <History className="h-4 w-4" />
                  View History ({changeHistory.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Given</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${donor.total_donated}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{donor.donation_count}</div>
            <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${donor.average_donation}</div>
            <p className="text-xs text-muted-foreground mt-1">Per donation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">First Donation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">{formatDate(donor.first_donation)}</div>
            <p className="text-xs text-muted-foreground mt-1">Member since</p>
          </CardContent>
        </Card>
      </div>

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donationHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No donation history found
                    </TableCell>
                  </TableRow>
                ) : (
                  donationHistory.map((donation) => (
                    <TableRow
                      key={donation.id}
                      onClick={() => onViewTransaction?.(donation.id.toString())}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <TableCell>{formatDate(donation.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${typeof donation.amount === 'number' ? donation.amount.toFixed(2) : parseFloat(donation.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {donation.is_recurring ? (
                          <Badge variant="secondary">Recurring</Badge>
                        ) : donation.is_custom_amount ? (
                          <Badge variant="outline">Custom</Badge>
                        ) : (
                          <Badge variant="outline">One-time</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {donation.receipt_sent ? (
                          <Badge variant="default">Sent</Badge>
                        ) : (
                          <Badge variant="secondary">Not Sent</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Donor Information</DialogTitle>
            <DialogDescription>
              Update the name or email for this donor. This will affect all {donor?.donation_count} transaction(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter donor name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                placeholder="Enter donor email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (optional)</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about why you're making this change..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={!editedName}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Please review the changes before saving.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This will update {donor?.donation_count} transaction(s). The previous information will be saved and can be reverted later.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Name</p>
                <p className="text-base">{donor?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Name</p>
                <p className="text-base font-semibold">{editedName}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Email</p>
                <p className="text-base">{donor?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Email</p>
                <p className="text-base font-semibold">{editedEmail || 'None'}</p>
              </div>
            </div>

            {notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{notes}</p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change History</DialogTitle>
            <DialogDescription>
              View all changes made to this donor's information and revert if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {changeHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No change history found</p>
            ) : (
              changeHistory.map((change) => (
                <Card key={change.id} className={change.is_reverted ? 'opacity-60' : ''}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={change.is_reverted ? 'outline' : 'default'}>
                              {change.change_type}
                            </Badge>
                            {change.is_reverted && (
                              <Badge variant="secondary">Reverted</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(change.changed_at)} by {change.changed_by}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!change.is_reverted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevertChange(change.id)}
                              disabled={reverting === change.id || deleting === change.id}
                              className="gap-2"
                            >
                              {reverting === change.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Reverting...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-4 w-4" />
                                  Revert
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteChange(change.id)}
                            disabled={deleting === change.id || reverting === change.id}
                            className="gap-2"
                          >
                            {deleting === change.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Previous</p>
                          <p>Name: {change.old_name || 'N/A'}</p>
                          <p>Email: {change.old_email || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Changed To</p>
                          <p>Name: {change.new_name || 'N/A'}</p>
                          <p>Email: {change.new_email || 'N/A'}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Affected {change.affected_transaction_count} transaction(s)
                      </p>

                      {change.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes</p>
                            <p className="text-sm mt-1">{change.notes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}