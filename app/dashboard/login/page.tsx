// app/dashboard/login/page.tsx
"use client"

import type React from "react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

function LoginPageContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    checkSession()

    // Check for OAuth error in URL
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [searchParams])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/dashboard/auth/session')
      if (response.ok) {
        // Already logged in, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      // Not logged in, stay on login page
    } finally {
      setCheckingSession(false)
    }
  }

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simply redirect to the login endpoint
      // The API route will redirect to Square
      window.location.href = '/api/dashboard/auth/login'

    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to initiate login. Please try again.')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgb(140, 120, 214) 0%, rgb(143, 181, 255) 33%, rgb(247, 194, 161) 66%, rgb(247, 107, 107) 100%)",
        }}>
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, rgb(140, 120, 214) 0%, rgb(143, 181, 255) 33%, rgb(247, 194, 161) 66%, rgb(247, 107, 107) 100%)",
      }}
    >
      {/* Main content card */}
      <div
        className="relative z-10 w-full max-w-lg mx-auto px-10 py-14 rounded-3xl"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex flex-col items-center space-y-8">
          {/* Logo with glass morphism */}
          <div className="mb-4">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 5px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Image src="/shulpad-logo.png" alt="ShulPad Logo" fill className="object-cover" />
            </div>
          </div>

          {/* Title and subtitle */}
          <div className="text-center space-y-2">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-wide leading-tight text-black"
            >
              Welcome to ShulPad
            </h1>
            <p className="hidden md:block text-base text-gray-600 px-4">
              Your complete dashboard for managing donations and donor relationships.
            </p>
          </div>

          {/* Features list */}
          <div className="hidden md:block w-full space-y-5 py-2 md:py-4">
            <FeatureRow text="View real-time donation analytics and insights" />
            <FeatureRow text="Manage donor information and relationships" />
            <FeatureRow text="Track transactions and generate detailed reports" />
            <FeatureRow text="Connect seamlessly with your Square account" />
          </div>

          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="w-full bg-red-50 border-red-200 text-red-800">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Status or button */}
          {loading ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <Loader2 className="h-12 w-12 animate-spin text-black" />
              <p className="text-lg font-semibold text-black">Connecting to Square...</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full">
              <Button
                type="submit"
                className="w-full py-6 px-8 rounded-2xl font-semibold text-base transition-all duration-200 hover:shadow-lg"
                style={{ backgroundColor: "black", color: "white" }}
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="md:hidden">Login With Square</span>
                  <span className="hidden md:inline">Connect with Square to Get Started</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Button>
            </form>
          )}

          {/* Terms text */}
          <p className="text-xs text-gray-600 text-center px-4 leading-relaxed">
            By continuing, you agree to connect your Square account to ShulPad.
            <br className="hidden md:inline" />
            <span className="hidden md:inline"> We'll use this to process payments and manage your donations.</span>
          </p>

          {/* Support link */}
          <div className="flex items-center gap-2 text-sm pt-2">
            <span className="text-black">Need help?</span>
            <a
              href="https://wa.me/16179032387"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-medium hover:underline transition-colors duration-200"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature row component
function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-black flex-shrink-0 mt-0.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-gray-600">{text}</span>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, rgb(140, 120, 214) 0%, rgb(143, 181, 255) 33%, rgb(247, 194, 161) 66%, rgb(247, 107, 107) 100%)",
        }}>
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}