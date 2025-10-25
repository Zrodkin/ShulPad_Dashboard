"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - in real app this would come from API/database
const getDonorByEmail = (email: string) => {
  const donors = [
    {
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 123-4567",
      address: "123 Oak Street, Springfield, IL 62701",
      totalGiven: 2450,
      donations: 12,
      firstDonation: "2023-06-15",
      lastDonation: "2024-01-15",
      averageDonation: 204.17,
      donationHistory: [
        { id: "TXN-007", date: "2024-01-12", amount: 200.0, kiosk: "Main Lobby", status: "completed" },
        { id: "TXN-001", date: "2024-01-15", amount: 50.0, kiosk: "Main Lobby", status: "completed" },
        { id: "TXN-015", date: "2023-12-20", amount: 150.0, kiosk: "East Wing", status: "completed" },
        { id: "TXN-023", date: "2023-11-18", amount: 100.0, kiosk: "Main Lobby", status: "completed" },
        { id: "TXN-031", date: "2023-10-10", amount: 75.0, kiosk: "West Wing", status: "completed" },
      ],
      preferredKiosk: "Main Lobby",
      tags: ["Monthly Donor", "Major Donor"],
    },
    {
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "(555) 234-5678",
      address: "456 Maple Ave, Springfield, IL 62702",
      totalGiven: 1890,
      donations: 8,
      firstDonation: "2023-08-01",
      lastDonation: "2024-01-15",
      averageDonation: 236.25,
      donationHistory: [
        { id: "TXN-002", date: "2024-01-15", amount: 100.0, kiosk: "East Wing", status: "completed" },
        { id: "TXN-012", date: "2023-12-28", amount: 250.0, kiosk: "East Wing", status: "completed" },
        { id: "TXN-019", date: "2023-11-30", amount: 200.0, kiosk: "Main Lobby", status: "completed" },
      ],
      preferredKiosk: "East Wing",
      tags: ["Corporate Donor"],
    },
  ]

  return donors.find((d) => d.email === email) || donors[0]
}

interface DonorDetailContentProps {
  donorEmail: string
  onBack: () => void
}

export function DonorDetailContent({ donorEmail, onBack }: DonorDetailContentProps) {
  const donor = getDonorByEmail(donorEmail)

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
                {donor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-foreground">{donor.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {donor.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Total Given */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Given</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${donor.totalGiven.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime contributions</p>
          </CardContent>
        </Card>

        {/* Number of Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donor.donations}</div>
            <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
          </CardContent>
        </Card>

        {/* Average Donation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${donor.averageDonation.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{donor.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{donor.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{donor.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Donation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">First Donation</p>
                <p className="font-medium">{donor.firstDonation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Last Donation</p>
                <p className="font-medium">{donor.lastDonation}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Preferred Kiosk</p>
                <p className="font-medium">{donor.preferredKiosk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donation History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Kiosk</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donor.donationHistory.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{donation.id}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{donation.date}</TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">${donation.amount.toFixed(2)}</TableCell>
                      <TableCell className="whitespace-nowrap">{donation.kiosk}</TableCell>
                      <TableCell>
                        <Badge variant="default">{donation.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
