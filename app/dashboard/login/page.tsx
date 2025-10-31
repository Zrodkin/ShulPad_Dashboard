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

  // State for animated circles
  const [circles, setCircles] = useState([
    { id: 1, top: 25, left: 25, opacity: 0.5, size: 32 },
    { id: 2, top: 75, right: 25, opacity: 0.4, size: 24 },
    { id: 3, top: 50, right: 33, opacity: 0.45, size: 16 }
  ])

  useEffect(() => {
    // Check if already logged in
    checkSession()

    // Check for OAuth error in URL
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [searchParams])

  // Animate circles with smooth, continuous movement
  useEffect(() => {
    const animateCircle = (index: number) => {
      // Generate new position
      const useLeft = Math.random() > 0.5
      const newPosition: any = {
        top: Math.random() * 80 + 10, // 10-90%
        opacity: Math.random() * 0.3 + 0.3 // 0.3-0.6
      }

      if (useLeft) {
        newPosition.left = Math.random() * 80 + 10
        newPosition.right = undefined
      } else {
        newPosition.right = Math.random() * 80 + 10
        newPosition.left = undefined
      }

      // First fade out while staying in place
      setCircles(prev => prev.map((circle, i) =>
        i === index ? { ...circle, opacity: 0 } : circle
      ))

      // After fade out completes, move to new position and fade back in
      setTimeout(() => {
        setCircles(prev => prev.map((circle, i) =>
          i === index ? { ...circle, ...newPosition } : circle
        ))
      }, 1500) // Wait for fade out to complete
    }

    // Different intervals for each circle (varying durations for organic feel)
    const intervals = [
      setInterval(() => animateCircle(0), 8000),
      setInterval(() => animateCircle(1), 7000),
      setInterval(() => animateCircle(2), 9000)
    ]

    // Start at staggered times
    setTimeout(() => animateCircle(1), 2000)
    setTimeout(() => animateCircle(2), 4500)

    return () => intervals.forEach(clearInterval)
  }, [])

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
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
        }}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
      }}
    >
      <div
        className="absolute inset-0 opacity-0"
        style={{
          background: "rgba(0, 0, 0, 0.15)",
        }}
      ></div>

      {/* Floating glass orbs for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {circles.map((circle, index) => (
          <div
            key={circle.id}
            className="absolute rounded-full"
            style={{
              top: `${circle.top}%`,
              left: circle.left !== undefined ? `${circle.left}%` : undefined,
              right: circle.right !== undefined ? `${circle.right}%` : undefined,
              width: `${circle.size * 4}px`,
              height: `${circle.size * 4}px`,
              opacity: circle.opacity,
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(20px) saturate(180%)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 32px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              transition: "all 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateZ(0)", // Enable GPU acceleration
              willChange: "opacity, top, left, right",
            }}
          />
        ))}
      </div>

      <Card
        className="max-w-md hover-lift relative z-10 w-full"
        style={{
          background: "rgb(255, 255, 255)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div className="flex justify-center pt-8 pb-4">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden"
            style={{
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(255, 255, 255, 0.3)",
            }}
          >
            <Image
              src="/shulpad-logo.png"
              alt="ShulPad Logo"
              fill
              className="object-cover"
              priority
              sizes="96px"
            />
          </div>
        </div>

        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold font-sans text-card-foreground">ShulPad Dashboard</CardTitle>
          <CardDescription className="text-card-foreground/70 font-sans">
            Sign in with Square to continue
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-200">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <Button
              type="submit"
              className="w-full ripple-effect hover-lift font-sans font-bold py-5 transition-all duration-300"
              style={{ backgroundColor: "#0C115B", color: "white" }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connecting to Square...</span>
                </span>
              ) : (
             <span className="flex items-center justify-center gap-3">
                  <span>Sign in with Square</span>
                </span>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-sm text-card-foreground/60">
              Don't have a Square account?{' '}
              <a
                href="https://squareup.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-card-foreground font-medium hover:underline transition-colors duration-200"
              >
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
        }}>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}