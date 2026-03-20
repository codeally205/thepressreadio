'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SearchModal from '@/components/search/SearchModal'
import SignOutForm from '@/components/auth/SignOutForm'

const categories = [
  'politics',
  'economy',
  'business',
  'culture',
  'sport',
  'technology',
  'health',
  'environment',
]

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

interface Article {
  id: string
  title: string
  slug: string
  coverImageUrl: string | null
}

export default function Header({ session }: { session: any }) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({})
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [leaveTimeout, setLeaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // Fetch articles for a specific category
  const fetchCategoryArticles = async (category: string) => {
    if (categoryArticles[category]) return // Already fetched

    try {
      const response = await fetch(`/api/articles/category/${category}?limit=3`)
      if (response.ok) {
        const articles = await response.json()
        setCategoryArticles(prev => ({
          ...prev,
          [category]: articles
        }))
      }
    } catch (error) {
      console.error(`Failed to fetch ${category} articles:`, error)
    }
  }

  const handleMouseEnter = (category: string) => {
    // Clear any existing leave timeout
    if (leaveTimeout) {
      clearTimeout(leaveTimeout)
      setLeaveTimeout(null)
    }

    // Set a delay before showing dropdown
    const timeout = setTimeout(() => {
      setActiveDropdown(category)
      fetchCategoryArticles(category)
    }, 200) // 200ms delay

    setHoverTimeout(timeout)
  }

  const handleMouseLeave = () => {
    // Clear hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }

    // Set a delay before hiding dropdown to allow clicking
    const timeout = setTimeout(() => {
      setActiveDropdown(null)
    }, 300) // 300ms delay to allow clicking

    setLeaveTimeout(timeout)
  }

  const handleDropdownMouseEnter = () => {
    // Clear leave timeout when hovering over dropdown
    if (leaveTimeout) {
      clearTimeout(leaveTimeout)
      setLeaveTimeout(null)
    }
  }

  const handleDropdownMouseLeave = () => {
    // Hide dropdown when leaving dropdown area
    setActiveDropdown(null)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        {/* Top bar with Logo and Actions */}
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="ThePressRadio"
                width={40}
                height={40}
                className="w-8 h-8 md:w-12 md:h-12 object-contain"
              />
              <span className="text-sm md:text-lg font-bold tracking-tight text-black">ThePressRadio</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/advertise" className="text-sm text-black hover:text-brand transition">
                Advertise
              </Link>
              
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-black hover:text-brand transition"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {session ? (
                <>
                  <Link href="/account" className="text-sm text-black hover:text-brand transition">
                    Account
                  </Link>
                  <SignOutForm className="text-sm text-black hover:text-brand transition">
                    Sign Out
                  </SignOutForm>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-black hover:text-brand transition">
                    Sign In
                  </Link>
                  <Link
                    href="/subscribe"
                    className="text-xs md:text-sm bg-brand text-white px-3 py-2 rounded hover:bg-brand-dark transition"
                  >
                    Subscribe
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-black hover:text-brand transition"
                aria-label="Search"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-black hover:text-brand transition"
                aria-label="Menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Main Navigation */}
        <div className="bg-white relative hidden md:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center justify-center gap-6 py-4">
              <Link
                href="/"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                Home
              </Link>
              
              {['politics', 'economy', 'business', 'technology', 'culture'].map((category) => (
                <div
                  key={category}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(category)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={`/${category}`}
                    className={`text-sm text-gray-800 hover:text-brand transition flex items-center gap-1 capitalize pb-1 ${
                      isActive(`/${category}`) 
                        ? 'border-b-2 border-black' 
                        : 'border-b-2 border-transparent'
                    }`}
                  >
                    {category}
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>

                  {/* Dropdown */}
                  {activeDropdown === category && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white shadow-lg border border-gray-200 p-6 z-50"
                      onMouseEnter={handleDropdownMouseEnter}
                      onMouseLeave={handleDropdownMouseLeave}
                    >
                      {categoryArticles[category] && categoryArticles[category].length > 0 ? (
                        <div className="grid grid-cols-3 gap-6">
                          {categoryArticles[category].slice(0, 3).map((article) => (
                            <Link
                              key={article.id}
                              href={`/article/${article.slug}`}
                              className="group block"
                            >
                              <div className="aspect-square relative overflow-hidden bg-gray-100 mb-3">
                                {article.coverImageUrl ? (
                                  <Image
                                    src={article.coverImageUrl}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No Image</span>
                                  </div>
                                )}
                              </div>
                              <h4 className="text-sm text-gray-800 line-clamp-2 group-hover:text-brand transition">
                                {article.title}
                              </h4>
                            </Link>
                          ))}
                        </div>
                      ) : categoryArticles[category] && categoryArticles[category].length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-sm">No articles available in this category</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 text-sm">Loading articles...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Divider */}
              <span className="text-gray-300">|</span>

              <Link
                href="/subscribe"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/subscribe') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                Pricing
              </Link>

              <span className="text-gray-300">|</span>

              <Link
                href="/short-videos"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/short-videos') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                Videos
              </Link>

              <span className="text-gray-300">|</span>

              <Link
                href="/latest"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/latest') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                Latest
              </Link>

              <span className="text-gray-300">|</span>

              <Link
                href="/newsletter"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/newsletter') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                Newsletter
              </Link>

              <span className="text-gray-300">|</span>

              <Link
                href="/about"
                className={`text-sm text-gray-800 hover:text-brand transition pb-1 ${
                  isActive('/about') 
                    ? 'border-b-2 border-black' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                About Us
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <nav className="px-4 py-4 space-y-4">
              <Link
                href="/"
                className="block text-sm text-gray-800 hover:text-brand transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              
              <Link
                href="/advertise"
                className="block text-sm text-gray-800 hover:text-brand transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Advertise
              </Link>
              
              {['politics', 'economy', 'business', 'technology', 'culture'].map((category) => (
                <Link
                  key={category}
                  href={`/${category}`}
                  className="block text-sm text-gray-800 hover:text-brand transition capitalize"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <Link
                  href="/subscribe"
                  className="block text-sm text-gray-800 hover:text-brand transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="/latest"
                  className="block text-sm text-gray-800 hover:text-brand transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Latest
                </Link>
                <Link
                  href="/short-videos"
                  className="block text-sm text-gray-800 hover:text-brand transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Videos
                </Link>
                <Link
                  href="/newsletter"
                  className="block text-sm text-gray-800 hover:text-brand transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Newsletter
                </Link>
                <Link
                  href="/about"
                  className="block text-sm text-gray-800 hover:text-brand transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About Us
                </Link>

                {session ? (
                  <>
                    <Link 
                      href="/account" 
                      className="block text-sm text-gray-800 hover:text-brand transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <SignOutForm className="text-sm text-gray-800 hover:text-brand transition">
                      Sign Out
                    </SignOutForm>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="block text-sm text-gray-800 hover:text-brand transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/subscribe"
                      className="block text-sm bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark transition w-fit"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Subscribe
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
