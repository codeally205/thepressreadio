import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata: Metadata = {
  title: 'Admin Dashboard - ThePressRadio',
  description: 'Content management system',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    redirect('/')
  }

  return <AdminLayoutClient user={session.user}>{children}</AdminLayoutClient>
}