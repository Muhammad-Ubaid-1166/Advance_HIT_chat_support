"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from "@/lib/api"
import type { ApiError } from "@/types/auth"

const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_new_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Passwords do not match",
    path: ["confirm_new_password"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_new_password: "",
    },
  })

  useEffect(() => {
    if (!token) {
      setError("No reset token found. Please request a new reset link.")
    }
  }, [token])

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormValues) => {
      if (!token) return Promise.reject(new Error("No token"))
      return resetPassword(token, data)
    },
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    },
    onError: (err: ApiError) => {
      if (err.message === "No token") {
        setError("No reset token found. Please request a new reset link.")
      } else if (!err.response) {
        setError("Unable to connect. Please check your connection.")
      } else {
        const errorCode = err.response.data?.error_code
        if (errorCode === "user_not_found") {
          setError("No account found with this email. Please sign up first.")
        } else if (errorCode === "token_invalid") {
          setError("This reset link is invalid or has expired.")
        } else {
          setError("Something went wrong. Please try again.")
        }
      }
    },
  })

  function onSubmit(data: ResetPasswordFormValues) {
    mutation.mutate(data)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Password reset successful!</h2>
        </div>
        <Alert>
          <AlertDescription>
            Your password has been reset. Redirecting to login...
          </AlertDescription>
        </Alert>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Reset your password</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your new password below
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {error.includes("sign up") && (
              <Link href="/signup" className="underline ml-1 font-medium">
                Sign up
              </Link>
            )}
            {error.includes("expired") && (
              <Link href="/forgot-password" className="underline ml-1 font-medium">
                Request a new link
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!token && !error ? (
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Loading token from URL...
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !token}
            >
              {mutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
