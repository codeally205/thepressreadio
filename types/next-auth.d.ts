import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role?: string
      subscriptionStatus?: string | null
      subscriptionPlan?: string | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
    subscriptionStatus?: string | null
    subscriptionPlan?: string | null
    subscriptionCheckedAt?: number
  }
}
