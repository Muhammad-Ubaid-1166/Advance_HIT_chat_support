import api from "./axios"
import type {
  SignupPayload,
  SignupResponse,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
} from "@/types/auth"

export async function signup(data: SignupPayload): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>("/api/v1/auth/signup", data)
  return response.data
}

export async function login(data: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/api/v1/auth/login", data)
  return response.data
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await api.get<{ message: string }>(
    `/api/v1/auth/verify/${token}`
  )
  return response.data
}

export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    "/api/v1/auth/password-reset-request",
    { email }
  )
  return response.data
}

export async function resetPassword(
  token: string,
  data: ResetPasswordPayload
): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>(
    `/api/v1/auth/password-reset-confirm/${token}`,
    data
  )
  return response.data
}

export async function logout(): Promise<void> {
  await api.get("/api/v1/auth/logout")
}
