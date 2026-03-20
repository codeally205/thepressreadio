import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import MobileTicker from '@/components/layout/MobileTicker'
import { auth } from '@/lib/auth'

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />
      <MobileTicker />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
