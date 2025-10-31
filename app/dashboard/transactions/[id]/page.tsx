"use client"

import { TransactionDetailContent } from "@/components/transaction-detail-content"
import { useRouter, useParams } from "next/navigation"

export default function TransactionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const transactionId = params.id as string

  const handleBack = () => {
    router.push("/dashboard/transactions")
  }

  const handleNavigateToDonor = (donorEmail: string) => {
    if (donorEmail) {
      router.push(`/dashboard/donors/${encodeURIComponent(donorEmail)}`)
    }
  }

  return (
    <TransactionDetailContent
      transactionId={transactionId}
      onBack={handleBack}
      onNavigateToDonor={handleNavigateToDonor}
    />
  )
}
