import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, MessageCircle, Mail, ExternalLink } from "lucide-react"

const helpResources = [
  {
    title: "Documentation",
    description: "Comprehensive guides and tutorials for using Shulpad",
    icon: BookOpen,
    action: "View Docs",
  },
  {
    title: "Contact Support",
    description: "Get help from our support team via email",
    icon: Mail,
    action: "Send Email",
  },
  {
    title: "Community Forum",
    description: "Connect with other Shulpad administrators",
    icon: MessageCircle,
    action: "Visit Forum",
  },
]

const faqs = [
  {
    question: "How do I add a new kiosk?",
    answer:
      "Navigate to the Kiosks page and click the 'Add Kiosk' button. Fill in the location details and configuration settings.",
  },
  {
    question: "Can I export donation data?",
    answer: "Yes! Go to the Transactions page and click the 'Export' button to download your data in CSV format.",
  },
  {
    question: "How do I set up a fundraising campaign?",
    answer:
      "Visit the Campaigns page, click 'New Campaign', and enter your goal amount, end date, and campaign details.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "Shulpad supports all major credit cards, debit cards, and digital wallets through our secure payment integration.",
  },
]

export function HelpContent() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground mt-1">Find answers and get assistance</p>
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
              <CardContent>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  {resource.action}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="space-y-2">
              <h3 className="font-semibold text-foreground">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
