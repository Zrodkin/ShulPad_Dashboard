"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

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

interface DonorDetailContentProps {
  donorEmail: string
  onBack: () => void
}

export function DonorDetailContent({ donorEmail, onBack }: DonorDetailContentProps) {
  const [donor, setDonor] = useState<Donor | null>(null)
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDonorDetails()
  }, [donorEmail])

  const fetchDonorDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/donors/${encodeURIComponent(donorEmail)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch donor details')
      }

      const data = await response.json()
      setDonor(data.donor)
      setDonationHistory(data.donation_history)
    } catch (err: any) {
      console.error('Error fetching donor:', err)
      setError(err.message)
    } finally {
      setLoading(false)
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
                    <TableRow key={donation.id}>
                      <TableCell>{formatDate(donation.created_at)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${donation.amount.toFixed(2)}
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
    </div>
  )
}