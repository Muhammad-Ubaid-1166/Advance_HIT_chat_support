"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { verifyEmail } from "@/lib/api"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No verification token found.")
      return
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success")
      })
      .catch(() => {
        setStatus("error")
        setErrorMessage("Verification link is invalid or expired.")
      })
  }, [token])

  return (
    <div className="space-y-4 text-center">
      {status === "loading" && (
        <>
          <h2 className="text-2xl font-bold">Verifying your email...</h2>
          <p className="text-muted-foreground text-sm">
            Please wait while we verify your account.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold">Email verified successfully!</h2>
          <p className="text-muted-foreground text-sm">Your account is ready.</p>
          <Link href="/login">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h2 className="text-2xl font-bold">Verification failed</h2>
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Verifying your email...</h2>
          <p className="text-muted-foreground text-sm">Please wait...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
