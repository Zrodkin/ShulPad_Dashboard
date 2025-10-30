"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { DashboardContentConnected } from "@/components/dashboard-content-connected"
import { TransactionsContent } from "@/components/transactions-content"
import { DonorsContent } from "@/components/donors-content"
import { ReportsContent } from "@/components/reports-content"
import { SettingsContent } from "@/components/settings-content"
import { HelpContent } from "@/components/help-content"
import { TransactionDetailContent } from "@/components/transaction-detail-content"
import { DonorDetailContent } from "@/components/donor-detail-content"
import { Loader2 } from "lucide-react"

export type NavigationItem =
  | "dashboard"
  | "transactions"
  | "donors"
  | "reports"
  | "settings"
  | "help"
  | "transaction-detail"
  | "donor-detail"

export function AdminDashboard() {
  const router = useRouter()
  const [activeView, setActiveView] = useState<NavigationItem>("dashboard")
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedDonorEmail, setSelectedDonorEmail] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/dashboard/auth/session')
      if (!response.ok) {
        router.push('/dashboard/login')
        return
      }
      const data = await response.json()
      if (!data.authenticated) {
        router.push('/dashboard/login')
        return
      }
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Authentication check failed:', error)
      router.push('/dashboard/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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

  const handleNavigateToDonorFromTransaction = (donorEmail: string) => {
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

        {activeView === "dashboard" && <DashboardContentConnected onDonorClick={handleViewDonor} />}
        {activeView === "transactions" && <TransactionsContent onViewTransaction={handleViewTransaction} />}
        {activeView === "donors" && <DonorsContent onViewDonor={handleViewDonor} />}
        {activeView === "reports" && <ReportsContent />}
        {activeView === "settings" && <SettingsContent />}
        {activeView === "help" && <HelpContent />}
        {activeView === "transaction-detail" && selectedTransactionId && (
          <TransactionDetailContent
            transactionId={selectedTransactionId}
            onBack={handleBackToTransactions}
            onNavigateToDonor={handleNavigateToDonorFromTransaction}
          />
        )}
        {activeView === "donor-detail" && selectedDonorEmail && (
          <DonorDetailContent
            donorEmail={selectedDonorEmail}
            onBack={handleBackToDonors}
            onViewTransaction={handleViewTransaction}
          />
        )}
      </main>
    </div>
  )
}