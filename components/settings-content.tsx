import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function SettingsContent() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your admin preferences and configurations</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Roles</CardTitle>
            <CardDescription>Manage user permissions and access levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Super Admin</p>
                <p className="text-sm text-muted-foreground">Full access to all features</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Manager</p>
                <p className="text-sm text-muted-foreground">Can view and edit most settings</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Viewer</p>
                <p className="text-sm text-muted-foreground">Read-only access to reports</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Integration</CardTitle>
            <CardDescription>Configure payment processing settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" type="password" placeholder="••••••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input id="webhook" placeholder="https://your-domain.com/webhook" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Test Mode</p>
                <p className="text-sm text-muted-foreground">Use test credentials for development</p>
              </div>
              <Switch />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kiosk Configuration</CardTitle>
            <CardDescription>Default settings for new kiosks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min-donation">Minimum Donation Amount</Label>
              <Input id="min-donation" type="number" placeholder="5.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-donation">Maximum Donation Amount</Label>
              <Input id="max-donation" type="number" placeholder="10000.00" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Anonymous Donations</p>
                <p className="text-sm text-muted-foreground">Allow donors to remain anonymous</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Receipt Email</p>
                <p className="text-sm text-muted-foreground">Send email receipts automatically</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button>Save Configuration</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
