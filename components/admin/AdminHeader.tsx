'use client'

import { User } from 'next-auth'
import SignOutButton from '@/components/auth/SignOutButton'
import Image from 'next/image'
import Link from 'next/link'

interface AdminHeaderProps {
  user: User
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ThePressRadio"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-black">ThePressRadio</span>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Admin Dashboard</p>
            </div>
          </Link>
          
          {/* Right side actions */}
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              target="_blank"
              className="text-sm text-gray-600 hover:text-brand transition flex items-center gap-1"
            >
              View Site
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            
            {/* User info and sign out */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-black">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              
              <SignOutButton className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                Sign Out
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}