// app/dashboard/login/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function DashboardLoginPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="h-10 w-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">ShulPad Dashboard</CardTitle>
          <CardDescription>
            Sign in with your Square account to access your merchant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 text-base"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to Square...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.01 8.54C6.15 8.54 7.89 6.8 7.89 4.66S6.15.78 4.01.78.13 2.52.13 4.66s1.74 3.88 3.88 3.88zm0 6.88c-2.14 0-3.88 1.74-3.88 3.88s1.74 3.88 3.88 3.88 3.88-1.74 3.88-3.88-1.74-3.88-3.88-3.88zm15.98 0c-2.14 0-3.88 1.74-3.88 3.88s1.74 3.88 3.88 3.88 3.88-1.74 3.88-3.88-1.74-3.88-3.88-3.88zm0-6.88c2.14 0 3.88-1.74 3.88-3.88S22.13.78 19.99.78s-3.88 1.74-3.88 3.88 1.74 3.88 3.88 3.88z" />
                </svg>
                Sign in with Square
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Don't have a Square account?</p>
            <a
              href="https://squareup.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Sign up for Square
            </a>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to connect your Square account with ShulPad.
              We only access your donation and customer data to provide dashboard analytics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}