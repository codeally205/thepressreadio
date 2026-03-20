'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TrialHandlerProps {
  userId: string
  userEmail: string
  hasSubscription: boolean
}

export default function TrialHandler({ userId, userEmail, hasSubscription }: TrialHandlerProps) {
  // Don't automatically create trials anymore
  // Trials should only be created when user clicks "Start Free Trial"
  
  if (hasSubscription) {
    return null // Don't show anything if user already has a subscription
  }

  // This component is now just a placeholder
  // Trial creation happens in the subscription flow
  return null
}