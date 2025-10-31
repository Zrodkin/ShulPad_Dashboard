"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle2, Users, Mail, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DonorGroup {
  email: string | null
  name: string
  donor_identifier: string
  donation_count: number
  total_donated: string
  first_donation: string
  last_donation: string
}

interface DuplicateGroup {
  match_type: 'same_email' | 'similar_name'
  match_key: string
  donors: DonorGroup[]
  total_donations: number
  total_amount: string
}

interface DuplicateDonorsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMergeComplete: () => void
}

export function DuplicateDonorsDialog({ open, onOpenChange, onMergeComplete }: DuplicateDonorsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)
  const [merging, setMerging] = useState(false)
  const [mergeSuccess, setMergeSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Merge form state
  const [primaryEmail, setPrimaryEmail] = useState<string>("")
  const [primaryName, setPrimaryName] = useState<string>("")
  const [selectedDonorIdentifiers, setSelectedDonorIdentifiers] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      fetchDuplicates()
    } else {
      // Reset state when dialog closes
      setSelectedGroup(null)
      setMergeSuccess(false)
      setError(null)
    }
  }, [open])

  const fetchDuplicates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/dashboard/donors/duplicates')

      if (!response.ok) {
        throw new Error('Failed to fetch duplicates')
      }

      const data = await response.json()
      setDuplicateGroups(data.duplicate_groups)
    } catch (err: any) {
      console.error('Error fetching duplicates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group)
    setMergeSuccess(false)
    setError(null)

    // Pre-populate with the most complete donor info
    const donorWithEmail = group.donors.find(d => d.email)
    const donorWithMostDonations = group.donors.reduce((prev, current) =>
      current.donation_count > prev.donation_count ? current : prev
    )

    setPrimaryEmail(donorWithEmail?.email || donorWithMostDonations.email || "")
    setPrimaryName(donorWithMostDonations.name)
    setSelectedDonorIdentifiers(group.donors.map(d => d.donor_identifier))
  }

  const handleMerge = async () => {
    if (!selectedGroup || selectedDonorIdentifiers.length < 2) {
      setError('Please select at least 2 donors to merge')
      return
    }

    if (!primaryName.trim()) {
      setError('Please enter a name for the merged donor')
      return
    }

    try {
      setMerging(true)
      setError(null)

      const response = await fetch('/api/dashboard/donors/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_email: primaryEmail || null,
          primary_name: primaryName.trim(),
          donor_identifiers_to_merge: selectedDonorIdentifiers,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to merge donors')
      }

      const result = await response.json()
      setMergeSuccess(true)

      // Refresh duplicates list after successful merge
      setTimeout(() => {
        fetchDuplicates()
        setSelectedGroup(null)
        onMergeComplete()
      }, 2000)

    } catch (err: any) {
      console.error('Error merging donors:', err)
      setError(err.message)
    } finally {
      setMerging(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Duplicate Donors
          </DialogTitle>
          <DialogDescription>
            Review and merge duplicate donor records to maintain accurate donor data.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : duplicateGroups.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              No duplicate donors detected. Your donor records are clean!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left side: List of duplicate groups */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Potential Duplicates ({duplicateGroups.length})
              </h3>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {duplicateGroups.map((group, idx) => (
                    <Card
                      key={idx}
                      className={`cursor-pointer transition-all ${
                        selectedGroup === group ? 'ring-2 ring-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => handleSelectGroup(group)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium">
                            {group.match_type === 'same_email' ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {group.match_key}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {group.match_key}
                              </div>
                            )}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {group.donors.length} records
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-xs text-muted-foreground">
                          {group.total_donations} donations • ${group.total_amount}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right side: Merge interface */}
            <div className="space-y-4">
              {!selectedGroup ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Select a duplicate group to review and merge
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Donor Records to Merge</CardTitle>
                      <CardDescription className="text-xs">
                        Select which records to include in the merge
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedGroup.donors.map((donor) => (
                        <div
                          key={donor.donor_identifier}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDonorIdentifiers.includes(donor.donor_identifier)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDonorIdentifiers([...selectedDonorIdentifiers, donor.donor_identifier])
                              } else {
                                setSelectedDonorIdentifiers(
                                  selectedDonorIdentifiers.filter(id => id !== donor.donor_identifier)
                                )
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-sm">{donor.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {donor.email || 'No email'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {donor.donation_count} donations • ${donor.total_donated}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              First: {formatDate(donor.first_donation)} • Last: {formatDate(donor.last_donation)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Primary Donor Information</CardTitle>
                      <CardDescription className="text-xs">
                        This will be the unified donor identity after merging
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="primary-name" className="text-xs">Name *</Label>
                        <Input
                          id="primary-name"
                          value={primaryName}
                          onChange={(e) => setPrimaryName(e.target.value)}
                          placeholder="Enter donor name"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primary-email" className="text-xs">Email</Label>
                        <Input
                          id="primary-email"
                          type="email"
                          value={primaryEmail}
                          onChange={(e) => setPrimaryEmail(e.target.value)}
                          placeholder="Enter donor email (optional)"
                          className="h-9 text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {mergeSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Successfully merged donors! Refreshing list...
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleMerge}
                      disabled={merging || selectedDonorIdentifiers.length < 2}
                      className="flex-1"
                    >
                      {merging ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Merging...
                        </>
                      ) : (
                        `Merge ${selectedDonorIdentifiers.length} Records`
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedGroup(null)}
                      disabled={merging}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
