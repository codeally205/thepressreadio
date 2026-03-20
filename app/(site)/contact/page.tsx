import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - The Press Radio',
  description: 'Get in touch with The Press Radio team. Send us your articles, feedback, or inquiries.',
  keywords: 'contact, the press radio, editor, submit article, feedback',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We&apos;d love to hear from you. Get in touch with our editorial team.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-4">Get In Touch</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Editorial Team</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  For article submissions, story tips, and editorial inquiries:
                </p>
                <a 
                  href="mailto:editor@thepressradio.com" 
                  className="text-brand hover:text-brand-dark font-medium underline transition-colors"
                >
                  editor@thepressradio.com
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-3">General Inquiries</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  For general questions and feedback:
                </p>
                <a 
                  href="mailto:info@thepressradio.com" 
                  className="text-brand hover:text-brand-dark font-medium underline transition-colors"
                >
                  info@thepressradio.com
                </a>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-3">Business Address</h3>
                <p className="text-gray-600 leading-relaxed">
                  Press Multimedia (Pty) Ltd<br />
                  Republic of South Africa
                </p>
              </div>
            </div>
          </div>

          {/* Submission Guidelines */}
          <div className="border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-4">Article Submissions</h2>
            
            <div className="space-y-6 text-gray-600">
              <p className="leading-relaxed">
                We welcome contributions from writers, journalists, and thought leaders 
                across Africa and beyond. Here&apos;s how to submit your work:
              </p>
              
              <ul className="list-disc list-inside space-y-3 leading-relaxed">
                <li>Send your article to <strong className="text-black">editor@thepressradio.com</strong></li>
                <li>Include a brief author bio (50-100 words)</li>
                <li>Attach high-quality images if relevant</li>
                <li>Ensure content is original and well-researched</li>
                <li>Articles should be 500-2000 words</li>
              </ul>

              <p className="text-sm text-gray-500 leading-relaxed">
                Our editorial team reviews all submissions and will respond within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="border border-gray-200 p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Stay connected with the latest news and updates from across Africa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:editor@thepressradio.com" 
              className="bg-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
            >
              Submit an Article
            </a>
            <a 
              href="/newsletter" 
              className="border border-black text-black px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
            >
              Subscribe to Newsletter
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}