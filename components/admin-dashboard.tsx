"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { TransactionsContent } from "@/components/transactions-content"
import { DonorsContent } from "@/components/donors-content"
import { ReportsContent } from "@/components/reports-content"
import { KiosksContent } from "@/components/kiosks-content"
import { CampaignsContent } from "@/components/campaigns-content"
import { SettingsContent } from "@/components/settings-content"
import { LogsContent } from "@/components/logs-content"
import { HelpContent } from "@/components/help-content"
import { TransactionDetailContent } from "@/components/transaction-detail-content"
import { DonorDetailContent } from "@/components/donor-detail-content"

export type NavigationItem =
  | "dashboard"
  | "transactions"
  | "donors"
  | "reports"
  | "kiosks"
  | "campaigns"
  | "settings"
  | "logs"
  | "help"
  | "transaction-detail"
  | "donor-detail"

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedDonorEmail, setSelectedDonorEmail] = useState<string | null>(null)

  const handleNavigate = (view: NavigationItem) => {
    setActiveView(view)
    setIsMobileSidebarOpen(false)
  }

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId)
    setActiveView("transaction-detail")
  }

  const handleViewDonor = (donorEmail: string) => {
    setSelectedDonorEmail(donorEmail)
    setActiveView("donor-detail")
  }

  const handleNavigateToDonorFromTransaction = (donorId: string) => {
    // Map donorId to email for now (in real app, would fetch by ID)
    const donorMap: Record<string, string> = {
      "DNR-001": "sarah.j@email.com",
      "DNR-002": "m.chen@email.com",
      "DNR-003": "emily.r@email.com",
    }
    const donorEmail = donorMap[donorId]
    if (donorEmail) {
      setSelectedDonorEmail(donorEmail)
      setActiveView("donor-detail")
    }
  }

  const handleBackToTransactions = () => {
    setActiveView("transactions")
    setSelectedTransactionId(null)
  }

  const handleBackToDonors = () => {
    setActiveView("donors")
    setSelectedDonorEmail(null)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-accent rounded-lg"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-foreground">Shulpad</h1>
          </div>
        </div>

        {activeView === "dashboard" && <DashboardContent onDonorClick={handleViewDonor} />}
        {activeView === "transactions" && <TransactionsContent onViewTransaction={handleViewTransaction} />}
        {activeView === "donors" && <DonorsContent onViewDonor={handleViewDonor} />}
        {activeView === "reports" && <ReportsContent />}
        {activeView === "kiosks" && <KiosksContent />}
        {activeView === "campaigns" && <CampaignsContent />}
        {activeView === "settings" && <SettingsContent />}
        {activeView === "logs" && <LogsContent />}
        {activeView === "help" && <HelpContent />}
        {activeView === "transaction-detail" && selectedTransactionId && (
          <TransactionDetailContent
            transactionId={selectedTransactionId}
            onBack={handleBackToTransactions}
            onNavigateToDonor={handleNavigateToDonorFromTransaction}
          />
        )}
        {activeView === "donor-detail" && selectedDonorEmail && (
          <DonorDetailContent donorEmail={selectedDonorEmail} onBack={handleBackToDonors} />
        )}
      </main>
    </div>
  )
}
