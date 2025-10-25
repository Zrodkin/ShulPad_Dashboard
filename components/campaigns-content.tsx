import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const campaigns = [
  { name: "Annual Building Fund", goal: 50000, raised: 35000, donors: 245, endDate: "2024-03-31" },
  { name: "Youth Education Program", goal: 25000, raised: 18500, donors: 156, endDate: "2024-02-28" },
  { name: "Community Outreach", goal: 15000, raised: 12300, donors: 98, endDate: "2024-04-15" },
]

export function CampaignsContent() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Track fundraising goals and campaign progress</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => {
          const progress = (campaign.raised / campaign.goal) * 100

          return (
            <Card key={campaign.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Ends {campaign.endDate}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Raised</p>
                    <p className="text-lg font-semibold text-foreground">${campaign.raised.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Goal</p>
                    <p className="text-lg font-semibold text-foreground">${campaign.goal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Donors</p>
                    <p className="text-lg font-semibold text-foreground">{campaign.donors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
