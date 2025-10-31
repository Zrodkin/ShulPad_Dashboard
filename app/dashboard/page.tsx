"use client"

import { DashboardContentConnected } from "@/components/dashboard-content-connected"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()

  const handleDonorClick = (donorEmail: string) => {
    router.push(`/dashboard/donors/${encodeURIComponent(donorEmail)}`)
  }

  return <DashboardContentConnected onDonorClick={handleDonorClick} />
}
