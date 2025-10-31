"use client"

import { TransactionsContent } from "@/components/transactions-content"
import { useRouter } from "next/navigation"

export default function TransactionsPage() {
  const router = useRouter()

  const handleViewTransaction = (transactionId: string) => {
    router.push(`/dashboard/transactions/${transactionId}`)
  }

  return <TransactionsContent onViewTransaction={handleViewTransaction} />
}
