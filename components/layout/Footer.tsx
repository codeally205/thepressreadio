import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white mt-0">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="inline-flex flex-col items-start gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="ThePressRadio"
                width={216}
                height={216}
                className="w-54 h-54 object-contain"
              />
              <div>
                <h3 className="font-bold text-sm text-white">THEPRESSRADIO</h3>
                <p className="text-xs text-gray-400">Quality journalism from Africa</p>
              </div>
            </Link>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-4 uppercase tracking-wide text-brand">Sections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/politics" className="text-gray-300 hover:text-brand transition">
                  Politics
                </Link>
              </li>
              <li>
                <Link href="/economy" className="text-gray-300 hover:text-brand transition">
                  Economy
                </Link>
              </li>
              <li>
                <Link href="/technology" className="text-gray-300 hover:text-brand transition">
                  Technology
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-4 uppercase tracking-wide text-brand">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-brand transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-brand transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/subscribe" className="text-gray-300 hover:text-brand transition">
                  Subscribe
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xs mb-4 uppercase tracking-wide text-brand">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-brand transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-brand transition">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ThePressRadio. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
