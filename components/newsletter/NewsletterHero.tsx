import Image from 'next/image'
import { EnvelopeIcon, GlobeAltIcon, NewspaperIcon } from '@heroicons/react/24/outline'

export default function NewsletterHero() {
  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white">
            <div className="flex items-center mb-6">
              <EnvelopeIcon className="h-8 w-8 text-blue-300 mr-3" />
              <span className="text-blue-300 font-semibold text-lg">ThePressRadio Newsletter</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stay Informed with
              <span className="text-blue-300 block">African News</span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Get the most important stories from across Africa delivered to your inbox every week. 
              From politics and business to culture and technology, we curate the news that matters.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-300 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Pan-African Coverage</span>
              </div>
              <div className="flex items-center">
                <NewspaperIcon className="h-5 w-5 text-blue-300 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Weekly Digest</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-100">Curated Content</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-300 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-blue-100">Privacy Focused</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-blue-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-sm text-blue-300">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">54</div>
                <div className="text-sm text-blue-300">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Weekly</div>
                <div className="text-sm text-blue-300">Delivery</div>
              </div>
            </div>
          </div>

          {/* Newsletter Preview */}
          <div className="relative">
            <div className="bg-white rounded-lg shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <EnvelopeIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">ThePressRadio Weekly</div>
                  <div className="text-sm text-gray-500">Your African News Digest</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                
                <div className="bg-blue-50 p-3 rounded mt-4">
                  <div className="h-2 bg-blue-200 rounded w-2/3 mb-2"></div>
                  <div className="h-2 bg-blue-200 rounded w-1/2"></div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">March 17, 2026</div>
                  <div className="text-xs text-blue-600 font-medium">Read Online →</div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center transform rotate-12">
              <span className="text-2xl">📧</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}