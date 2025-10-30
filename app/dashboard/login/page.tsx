// app/dashboard/login/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[size:32px_32px]" />

      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-12 space-y-6">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-slate-600 to-slate-400 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <Image
                  src="/shulpad-logo.png"
                  alt="ShulPad"
                  width={120}
                  height={120}
                  className="w-28 h-28 object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              ShulPad
            </h1>
            <p className="text-slate-400 text-base font-medium">
              Merchant Dashboard
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-600 to-slate-400 rounded-2xl opacity-20 blur group-hover:opacity-30 transition duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              {/* Welcome text */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  Welcome back
                </h2>
                <p className="text-slate-400 text-sm">
                  Sign in with your Square account to continue
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-900/50 text-red-200">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login button */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-14 text-base font-semibold bg-white text-slate-950 hover:bg-slate-100 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting to Square...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.01 8.54C6.15 8.54 7.89 6.8 7.89 4.66S6.15.78 4.01.78.13 2.52.13 4.66s1.74 3.88 3.88 3.88zm0 6.88c-2.14 0-3.88 1.74-3.88 3.88s1.74 3.88 3.88 3.88 3.88-1.74 3.88-3.88-1.74-3.88-3.88-3.88zm15.98 0c-2.14 0-3.88 1.74-3.88 3.88s1.74 3.88 3.88 3.88 3.88-1.74 3.88-3.88-1.74-3.88-3.88-3.88zm0-6.88c2.14 0 3.88-1.74 3.88-3.88S22.13.78 19.99.78s-3.88 1.74-3.88 3.88 1.74 3.88 3.88 3.88z" />
                    </svg>
                    <span>Sign in with Square</span>
                  </span>
                )}
              </Button>

              {/* Sign up link */}
              <div className="text-center pt-2">
                <p className="text-sm text-slate-500">
                  Don't have a Square account?{' '}
                  <a
                    href="https://squareup.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white font-medium transition-colors duration-200"
                  >
                    Sign up
                  </a>
                </p>
              </div>

              {/* Privacy notice */}
              <div className="pt-6 border-t border-slate-800/50">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  By signing in, you agree to connect your Square account with ShulPad.
                  We only access donation and customer data to provide analytics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-center mt-8">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ShulPad. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}