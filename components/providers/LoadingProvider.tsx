'use client'

import { createContext, useContext, useState } from 'react'

interface LoadingContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  isContentLoaded: boolean
  setIsContentLoaded: (loaded: boolean) => void
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: true,
  setIsLoading: () => {},
  isContentLoaded: false,
  setIsContentLoaded: () => {},
})

export const useLoading = () => useContext(LoadingContext)

interface LoadingProviderProps {
  children: React.ReactNode
  showMainLoader?: boolean
}

export function LoadingProvider({ children, showMainLoader = false }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isContentLoaded, setIsContentLoaded] = useState(false)

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setIsLoading, 
      isContentLoaded, 
      setIsContentLoaded 
    }}>
      {children}
    </LoadingContext.Provider>
  )
}