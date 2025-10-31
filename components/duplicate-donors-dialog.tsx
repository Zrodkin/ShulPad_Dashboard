"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface DonorRecord {
  email: string | null
  name: string | null
  donation_count: number
  total_amount: string
  first_donation: string
  last_donation: string
}

interface DuplicateGroup {
  type: 'email' | 'name'
  key: string
  donors: DonorRecord[]
  stats: {
    total_donations: number
    total_amount: string
  }
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup
  onMerge: () => void
}

function DuplicateGroupCard({ group, onMerge }: DuplicateGroupCardProps) {
  const [selectedDonors, setSelectedDonors] = useState<DonorRecord[]>([])
  const [primaryEmail, setPrimaryEmail] = useState<string>("")
  const [primaryName, setPrimaryName] = useState<string>("")
  const [merging, setMerging] = useState(false)

  // Initialize with all donors selected and populate primary info with most complete record
  useEffect(() => {
    setSelectedDonors(group.donors)

    // Find the most complete donor record (has both name and email)
    const mostComplete = group.donors.find(d => d.name && d.email) ||
                        group.donors.find(d => d.name) ||
                        group.donors[0]

    setPrimaryEmail(mostComplete.email || "")
    setPrimaryName(mostComplete.name || "")
  }, [group])

  const toggleDonor = (donor: DonorRecord) => {
    setSelectedDonors(prev => {
      const isSelected = prev.some(d => d.email === donor.email && d.name === donor.name)
      if (isSelected) {
        return prev.filter(d => !(d.email === donor.email && d.name === donor.name))
      } else {
        return [...prev, donor]
      }
    })
  }

  const isDonorSelected = (donor: DonorRecord) => {
    return selectedDonors.some(d => d.email === donor.email && d.name === donor.name)
  }

  const handleMerge = async () => {
    if (selectedDonors.length < 2) {
      toast.error("Please select at least 2 donors to merge")
      return
    }

    if (!primaryName.trim()) {
      toast.error("Please provide a name for the merged donor")
      return
    }

    setMerging(true)

    try {
      const response = await fetch('/api/dashboard/donors/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donors_to_merge: selectedDonors,
          primary_donor: {
            email: primaryEmail || null,
            name: primaryName,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge donors')
      }

      toast.success(`Successfully merged ${data.donations_updated} donations!`)
      onMerge() // Callback to refresh the duplicate list
    } catch (error: any) {
      console.error('Error merging donors:', error)
      toast.error(error.message || 'Failed to merge donors')
    } finally {
      setMerging(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {group.type === 'email' ? (
                <>
                  <Mail className="inline h-4 w-4 mr-2" />
                  Same Email: {group.key}
                </>
              ) : (
                <>
                  <User className="inline h-4 w-4 mr-2" />
                  Similar Name: {group.key}
                </>
              )}
            </CardTitle>
            <Badge variant={group.type === 'email' ? 'default' : 'secondary'}>
              {group.type === 'email' ? 'Email Match' : 'Name Match'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {group.stats.total_donations} donations • ${group.stats.total_amount}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Donor Records */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select donors to merge:</Label>
            {group.donors.map((donor, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  checked={isDonorSelected(donor)}
                  onCheckedChange={() => toggleDonor(donor)}
                  id={`donor-${group.key}-${idx}`}
                />
                <label
                  htmlFor={`donor-${group.key}-${idx}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {donor.name || <span className="text-muted-foreground italic">No name</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {donor.email || <span className="italic">No email</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">${donor.total_amount}</div>
                      <div className="text-muted-foreground">{donor.donation_count} donations</div>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Unified Donor Info */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Unified Donor Identity:</Label>
            <div className="grid gap-3">
              <div>
                <Label htmlFor={`name-${group.key}`}>Name *</Label>
                <Input
                  id={`name-${group.key}`}
                  value={primaryName}
                  onChange={(e) => setPrimaryName(e.target.value)}
                  placeholder="Donor name"
                  required
                />
              </div>
              <div>
                <Label htmlFor={`email-${group.key}`}>Email</Label>
                <Input
                  id={`email-${group.key}`}
                  type="email"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  placeholder="donor@example.com (optional)"
                />
              </div>
            </div>
          </div>

          {/* Merge Button */}
          <Button
            onClick={handleMerge}
            disabled={selectedDonors.length < 2 || !primaryName.trim() || merging}
            className="w-full"
          >
            {merging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Merge {selectedDonors.length} Donors
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function DuplicateDonorsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchDuplicates = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/donors/duplicates')

      if (!response.ok) {
        throw new Error('Failed to fetch duplicate donors')
      }

      const data = await response.json()
      setDuplicateGroups(data.duplicate_groups || [])
    } catch (err: any) {
      console.error('Error fetching duplicates:', err)
      setError(err.message || 'Failed to load duplicate donors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchDuplicates()
    }
  }, [open])

  const handleMergeComplete = () => {
    // Refresh the duplicate list after a successful merge
    fetchDuplicates()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Manage Duplicates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Duplicate Donors</DialogTitle>
          <DialogDescription>
            Review and merge duplicate donor records to maintain clean data.
            All donation history will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : duplicateGroups.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                No duplicate donors found! Your donor data is clean.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-1">
              <div className="mb-4 text-sm text-muted-foreground">
                Found {duplicateGroups.length} duplicate group{duplicateGroups.length !== 1 ? 's' : ''} affecting{' '}
                {duplicateGroups.reduce((sum, g) => sum + g.donors.length, 0)} donor records
              </div>

              {duplicateGroups.map((group, idx) => (
                <DuplicateGroupCard
                  key={`${group.type}-${group.key}-${idx}`}
                  group={group}
                  onMerge={handleMergeComplete}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
