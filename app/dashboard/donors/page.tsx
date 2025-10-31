"use client"

import { DonorsContent } from "@/components/donors-content"
import { useRouter } from "next/navigation"

export default function DonorsPage() {
  const router = useRouter()

  const handleViewDonor = (donorEmail: string) => {
    router.push(`/dashboard/donors/${encodeURIComponent(donorEmail)}`)
  }

  return <DonorsContent onViewDonor={handleViewDonor} />
}
