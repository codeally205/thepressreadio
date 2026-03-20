import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advertise With Us - The Press Radio',
  description: 'Reach engaged African news readers and grow your business with targeted advertising on ThePressRadio platform. Banner ads, video ads, music uploads, and job postings available.',
  keywords: 'advertise, advertising, banner ads, video ads, african news, thepressradio, marketing, promotion',
}

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-white font-playfair">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Advertise With Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Reach engaged African news readers and grow your business with targeted advertising
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Special Packages Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 border-b border-gray-200 pb-4">Special Advertising Packages</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6 mb-12">
            <p>
              Below are our special price banner and video advertising contracts available on home page, 
              articles, and widgets. Choose the package that best fits your marketing needs and budget.
            </p>
          </div>

          {/* Banner Ads Table */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-black mb-6">Banner Advertisements</h3>
            <div className="border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-black border-b border-gray-200">Advertisement Product</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">Monthly</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">3-Month Contract</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">6-Month Contract</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">Yearly Contract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Banner on Home Page Header Only</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$75</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$100</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$190</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$470</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Banner on Page Header & Articles</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$70</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$90</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$170</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$360</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Banner on Widgets Only</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$80</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$120</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$210</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$500</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Banner on Widgets & Articles</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$100</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$140</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$230</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$530</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Video Ads Table */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-black mb-6">Video Advertisements</h3>
            <div className="border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-black border-b border-gray-200">Advertisement Product</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">Monthly</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">3-Month Contract</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">6-Month Contract</th>
                      <th className="px-6 py-4 text-center font-bold text-black border-b border-gray-200">Yearly Contract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Video on Home Page Only</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$135</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$250</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$500</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$800</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Video on Home Page & Articles</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$300</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$370</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$410</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$600</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Video on Widgets Only</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$200</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$250</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$310</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$450</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">Video on Widget & Articles</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$270</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$320</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$720</td>
                      <td className="px-6 py-4 text-center text-xl font-bold text-brand">$970</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Additional Services */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Music Artist Services */}
            <div className="border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-black mb-6">Music Artist Services</h3>
              <p className="text-lg text-gray-600 mb-6">Upload your music and videos to reach our African audience</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-bold text-black">Service</th>
                    <th className="text-center py-3 font-bold text-black">Duration</th>
                    <th className="text-center py-3 font-bold text-black">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="py-4 font-medium text-gray-900">MP3 Upload</td>
                    <td className="py-4 text-center text-gray-700">Forever</td>
                    <td className="py-4 text-center text-xl font-bold text-brand">$10</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-gray-900">MP4 Upload</td>
                    <td className="py-4 text-center text-gray-700">Forever</td>
                    <td className="py-4 text-center text-xl font-bold text-brand">$15</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-gray-900">MP3 + MP4 Bundle</td>
                    <td className="py-4 text-center text-gray-700">Forever</td>
                    <td className="py-4 text-center text-xl font-bold text-brand">$25</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Job Vacancies */}
            <div className="border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-black mb-6">Job Vacancies</h3>
              <p className="text-lg text-gray-600 mb-6">Post your job vacancy and reach qualified candidates across Africa and the diaspora</p>
              <div className="text-center">
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Duration: Until Position Expires</div>
                  <div className="text-3xl font-bold text-brand">$250</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-black mb-8 border-b border-gray-200 pb-4">Contact Our Marketing Department</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6 mb-8">
            <p>
              Ready to advertise with us? Contact our marketing department for personalized service 
              and to discuss the best advertising package for your business needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-black mb-4">Call or WhatsApp</h3>
              <a
                href="tel:+27733333133"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-lg font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                <PhoneIcon className="w-5 h-5 mr-3" />
                +27-733-333-133
              </a>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-black mb-4">Email Marketing Department</h3>
              <a
                href="mailto:thepressradio@gmail.com"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-lg font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors"
              >
                <EnvelopeIcon className="w-5 h-5 mr-3" />
                thepressradio@gmail.com
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xl font-bold text-black mb-4">Article Publication</h3>
            <p className="mb-6">
              To feature your article, kindly send it to: 
              <a 
                href="mailto:editor@thepressradio.com" 
                className="font-medium text-brand hover:text-brand-dark transition-colors ml-2 underline"
              >
                editor@thepressradio.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}