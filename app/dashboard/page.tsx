"use client"

import { DashboardContentConnected } from "@/components/dashboard-content-connected"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  const handleDonorClick = (donorEmail: string) => {
    router.push(`/dashboard/donors/${encodeURIComponent(donorEmail)}`)
  }

  const handleTransactionClick = (transactionId: string) => {
    router.push(`/dashboard/transactions/${transactionId}`)
  }

  const handleNavigate = (view: 'transactions' | 'donors') => {
    router.push(`/dashboard/${view}`)
  }

  return (
    <DashboardContentConnected
      onDonorClick={handleDonorClick}
      onTransactionClick={handleTransactionClick}
      onNavigate={handleNavigate}
    />
  )
}
