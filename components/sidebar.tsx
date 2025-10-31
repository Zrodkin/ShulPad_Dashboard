"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  Receipt,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Search,
  X,
  LogOut,
  User,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"

interface SidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "transactions", label: "Transactions", icon: Receipt, href: "/dashboard/transactions" },
  { id: "donors", label: "Donors", icon: Users, href: "/dashboard/donors" },
  { id: "reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { id: "help", label: "Help", icon: HelpCircle, href: "/dashboard/help" },
]

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string>("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Fetch user session info
    fetch('/api/dashboard/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.email) {
          setUserEmail(data.email)
        } else if (data.authenticated && data.merchant_name) {
          setUserEmail(data.merchant_name)
        }
      })
      .catch(err => console.error('Failed to fetch session:', err))
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/dashboard/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/dashboard/login')
      } else {
        console.error('Logout failed')
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 border-r border-border bg-card flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/New%20Shul%20Pad%20Logo%20Square%202.0-m6QgFwyzSBQzCBLFKYkHOyYgblLPdN.png"
                alt="Shulpad Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h1 className="text-xl font-semibold text-foreground">Shulpad</h1>
            </div>
            <button
              onClick={onMobileClose}
              className="lg:hidden p-2 hover:bg-accent rounded-lg"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 bg-background" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href))

            return (
              <Link key={item.id} href={item.href} onClick={onMobileClose}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {userEmail && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-accent/50 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground truncate">{userEmail}</span>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </aside>
    </>
  )
}
