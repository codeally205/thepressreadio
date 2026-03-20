import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - The Press Radio',
  description: 'Learn about The Press Radio - A vertical portal owned and operated by Ghanaian Journalist Mr Solomon Ogyem, publishing news from Nigeria, Ghana, South Africa, and across Africa.',
  keywords: 'about us, the press radio, african news, solomon ogyem, press multimedia, south africa, ghana, nigeria',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-playfair">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              About Us
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Quality journalism from Africa, for Africa and the world
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Our Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 border-b border-gray-200 pb-4">Our Story</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <p>
              <strong>www.thepressradio.com</strong> is a vertical portal owned and operated by a Ghanaian Journalist 
              <strong> Mr Solomon Ogyem</strong>. The portal publishes everything related to Nigeria, Ghana, South Africa, 
              Africa and the World. Aside news from these continent, we offer background information, opinions, 
              the facility to listen to our online radio-station <strong>THE PRESS RADIO</strong> located in the 
              Republic of South Africa (RSA), classifieds, a social network for Africa and many more.
            </p>

            <p>
              The portal was launched by a privately owned company <strong>&quot;Press Multimedia (Pty) LTD&quot;</strong> in 
              South Africa and also operates under the laws of South Africa. Through this legal setup, we publish 
              news from Nigeria, Ghana, South Africa and other African countries in a completely independent and 
              neutral manner.
            </p>

            <p>
              Also, we have established a platform where Our Fans can express themselves freely through opinion 
              articles and by commenting on the news without being censored.
            </p>

            <p>
              <strong>www.thepressradio.com</strong> is however a medium made for and by Africans. The news on the 
              portal is updated by a team of editors who write articles or aggregate from a wide range of African media.
            </p>
          </div>
        </div>

        {/* Technical Excellence Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 border-b border-gray-200 pb-4">Technical Excellence</h2>
          
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
            <p>
              Our portal is constantly being improved and extended by <strong>&quot;Press Multimedia (Pty) Ltd.&quot;</strong> 
              web developers and web designers. At a functional level, the portal is designed to meet the requirements 
              of the <strong>125,000 unique visitors</strong> who patronize www.thepressradio.com each month.
            </p>

            <p>
              At a technical level, the portal is constructed to load smoothly and reliably even in remote parts 
              of Africa, Asia, Europe, USA etc. Our visitors are predominantly Africans and the West.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center border border-gray-200 p-8">
            <div className="text-4xl font-bold text-black mb-2">125K+</div>
            <div className="text-gray-600">Monthly Visitors</div>
          </div>
          
          <div className="text-center border border-gray-200 p-8">
            <div className="text-4xl font-bold text-black mb-2">4+</div>
            <div className="text-gray-600">African Countries Covered</div>
          </div>
          
          <div className="text-center border border-gray-200 p-8">
            <div className="text-4xl font-bold text-black mb-2">24/7</div>
            <div className="text-gray-600">News Updates</div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-black mb-6">Get Featured</h2>
          
          <div className="text-lg leading-relaxed text-gray-700">
            <p className="mb-4">
              Want to share your story with our African community? We welcome contributions from writers, 
              journalists, and thought leaders across the continent.
            </p>
            
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