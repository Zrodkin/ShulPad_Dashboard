import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageCircle, Mail } from "lucide-react"

const helpResources = [
  {
    title: "Call",
    description: "Speak directly with our support team",
    icon: Phone,
    action: "Call Now",
    contact: "+1 (617) 903-2387",
    href: "tel:+16179032387",
  },
  {
    title: "Chat",
    description: "Message us on WhatsApp for quick support",
    icon: MessageCircle,
    action: "Chat on WhatsApp",
    contact: "+1 (617) 903-2387",
    href: "https://wa.me/16179032387",
  },
  {
    title: "Email",
    description: "Send us an email and we'll respond shortly",
    icon: Mail,
    action: "Send Email",
    contact: "info@shulpad.com",
    href: "mailto:info@shulpad.com",
  },
]

export function HelpContent() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground mt-1">Get in touch with us</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {helpResources.map((resource) => {
          const Icon = resource.icon
          return (
            <Card key={resource.title}>
              <CardHeader>
                <div className="p-2 bg-primary/10 rounded-lg w-fit mb-2">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium text-foreground">{resource.contact}</p>
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                  asChild
                >
                  <a href={resource.href}>
                    {resource.action}
                  </a>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
