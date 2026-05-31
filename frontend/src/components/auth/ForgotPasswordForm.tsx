"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"

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
import { forgotPassword } from "@/lib/api"
import type { ApiError } from "@/types/auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordFormValues) => forgotPassword(data.email),
    onSuccess: () => {
      setSuccess(true)
      setError(null)
    },
    onError: (err: ApiError) => {
      setSuccess(false)
      if (!err.response) {
        setError("Unable to connect. Please check your connection.")
      } else {
        setError(err.response?.data?.message || "Something went wrong")
      }
    },
  })

  function onSubmit(data: ForgotPasswordFormValues) {
    mutation.mutate(data)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Check your email</h2>
        </div>
        <Alert>
          <AlertDescription>
            If this email exists, a reset link has been sent. Please check your
            inbox.
          </AlertDescription>
        </Alert>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Forgot password?</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
