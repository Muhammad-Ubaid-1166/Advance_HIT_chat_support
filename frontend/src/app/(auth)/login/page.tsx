import { Suspense } from "react"
import LoginForm from "@/components/auth/LoginForm"

function LoginContent() {
  return <LoginForm />
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
