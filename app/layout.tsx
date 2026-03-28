import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { LoadingProvider } from '@/components/providers/LoadingProvider'
import SessionProvider from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import MainLoader from '@/components/ui/MainLoader'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
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
      <body className={`${inter.variable} ${playfair.variable} font-inter font-light`}>
        <MainLoader />
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
