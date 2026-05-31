export interface User {
  email: string
  user_uid: string
  role: string
}

export interface DecodedToken {
  user: User
  exp: number
  jti: string
  refresh: boolean
}

export interface SignupPayload {
  first_name: string
  last_name: string
  username: string
  email: string
  password: string
}

export interface SignupResponse {
  message: string
  user: {
    uid: string
    username: string
    email: string
    first_name: string
    last_name: string
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  access_token: string
  refresh_token: string
  user: {
    email: string
    uid: string
  }
}

export interface ResetPasswordPayload {
  new_password: string
  confirm_new_password: string
}

export interface ApiError {
  response?: {
    status: number
    data: {
      message?: string
      error_code?: string
      detail?: string
    }
  }
  message?: string
}
