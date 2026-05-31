"use client"

import { Suspense } from "react"
import ResetPasswordForm from "@/components/auth/ResetPasswordForm"

function ResetPasswordContent() {
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Reset your password</h2>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
