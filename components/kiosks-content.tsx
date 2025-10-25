import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const kiosks = [
  { id: "K-001", location: "Main Lobby", status: "online", totalDonations: "$12,500", lastActive: "2 min ago" },
  { id: "K-002", location: "East Wing", status: "online", totalDonations: "$8,900", lastActive: "5 min ago" },
  { id: "K-003", location: "West Wing", status: "offline", totalDonations: "$7,200", lastActive: "2 hours ago" },
  { id: "K-004", location: "North Entrance", status: "online", totalDonations: "$6,800", lastActive: "1 min ago" },
  { id: "K-005", location: "South Hall", status: "online", totalDonations: "$5,400", lastActive: "8 min ago" },
]

export function KiosksContent() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Kiosks</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Monitor and manage your donation kiosk locations
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" size="sm">
          <Plus className="h-4 w-4" />
          Add Kiosk
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search kiosks..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Kiosk ID</TableHead>
                    <TableHead className="whitespace-nowrap">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Total Donations</TableHead>
                    <TableHead className="whitespace-nowrap">Last Active</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kiosks.map((kiosk) => (
                    <TableRow key={kiosk.id}>
                      <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">{kiosk.id}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{kiosk.location}</TableCell>
                      <TableCell>
                        <Badge variant={kiosk.status === "online" ? "default" : "secondary"}>{kiosk.status}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">{kiosk.totalDonations}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{kiosk.lastActive}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="whitespace-nowrap">
                          Configure
                        </Button>
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
