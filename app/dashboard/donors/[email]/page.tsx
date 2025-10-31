"use client"

import { DonorDetailContent } from "@/components/donor-detail-content"
import { useRouter, useParams } from "next/navigation"

export default function DonorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const donorEmail = decodeURIComponent(params.email as string)

  const handleBack = () => {
    router.push("/dashboard/donors")
  }

  const handleViewTransaction = (transactionId: string) => {
    router.push(`/dashboard/transactions/${transactionId}`)
  }

  const handleDonorUpdated = (newDonorIdentifier: string) => {
    router.push(`/dashboard/donors/${encodeURIComponent(newDonorIdentifier)}`)
  }

  return (
    <DonorDetailContent
      donorEmail={donorEmail}
      onBack={handleBack}
      onViewTransaction={handleViewTransaction}
      onDonorUpdated={handleDonorUpdated}
    />
  )
}
