'use client'

import { createContext, useContext } from 'react'

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
  subscriptionStatus?: string | null
  subscriptionPlan?: string | null
}

interface Session {
  user: User
}

interface AuthContextType {
  session: Session | null
}

const AuthContext = createContext<AuthContextType>({ session: null })

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: React.ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  )
}