import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { LoadingProvider } from '@/components/providers/LoadingProvider'
import SessionProvider from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'ThePressRadio',
  description: 'Pan-African digital news platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable}`}>
        <SessionProvider>
          <ToastProvider>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
