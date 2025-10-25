import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const logs = [
  {
    timestamp: "2024-01-15 14:32:15",
    user: "admin@shulpad.com",
    action: "Updated kiosk configuration",
    target: "K-001",
    type: "config",
  },
  {
    timestamp: "2024-01-15 14:28:42",
    user: "manager@shulpad.com",
    action: "Exported transaction report",
    target: "All",
    type: "export",
  },
  {
    timestamp: "2024-01-15 14:15:03",
    user: "admin@shulpad.com",
    action: "Created new campaign",
    target: "Annual Fund",
    type: "create",
  },
  {
    timestamp: "2024-01-15 13:45:21",
    user: "admin@shulpad.com",
    action: "Modified donor information",
    target: "Sarah Johnson",
    type: "edit",
  },
  {
    timestamp: "2024-01-15 13:22:18",
    user: "manager@shulpad.com",
    action: "Viewed reports dashboard",
    target: "Reports",
    type: "view",
  },
  {
    timestamp: "2024-01-15 12:58:33",
    user: "admin@shulpad.com",
    action: "Added new kiosk",
    target: "K-006",
    type: "create",
  },
]

export function LogsContent() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">Audit trail of all administrative actions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="text-muted-foreground">{log.target}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.type}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
