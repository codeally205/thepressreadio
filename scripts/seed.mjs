import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { articles } from '../lib/db/schema.js'

const mockArticles = [
  {
    title: 'African Tech Startups Raise Record $2.5 Billion in 2024',
    slug: 'african-tech-startups-record-funding',
    excerpt: 'Investment in African technology companies reaches unprecedented levels as venture capitalists recognize the continent\'s potential.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Nigeria\'s Economy Shows Signs of Recovery Amid Global Uncertainty',
    slug: 'nigeria-economy-recovery',
    excerpt: 'Economic indicators suggest Nigeria is bouncing back from recent challenges with improved GDP growth and inflation control.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  },
  {
    title: 'South Africa\'s Renewable Energy Revolution Accelerates',
    slug: 'south-africa-renewable-energy',
    excerpt: 'New solar and wind projects promise to transform South Africa\'s energy landscape and reduce dependence on coal.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e938aa1ef14?w=800&h=450&fit=crop',
  },
  {
    title: 'Kenya\'s Tech Hub Becomes Africa\'s Silicon Valley',
    slug: 'kenya-tech-hub-silicon-valley',
    excerpt: 'Nairobi\'s thriving startup ecosystem attracts global investors and talented entrepreneurs from across the continent.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
  },
  {
    title: 'Ghana\'s Gold Production Reaches 10-Year High',
    slug: 'ghana-gold-production-high',
    excerpt: 'Mining sector expansion drives economic growth as Ghana solidifies its position as a major gold producer.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&h=450&fit=crop',
  },
  {
    title: 'African Union Launches Continental Free Trade Initiative',
    slug: 'african-union-free-trade',
    excerpt: 'New trade agreement aims to boost intra-African commerce and create millions of jobs across the continent.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Ethiopia\'s Digital Transformation Reshapes Banking Sector',
    slug: 'ethiopia-digital-banking',
    excerpt: 'Mobile banking and fintech innovations are bringing financial services to millions of previously unbanked Ethiopians.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop',
  },
  {
    title: 'Rwanda Hosts Africa\'s Largest Tech Conference',
    slug: 'rwanda-tech-conference',
    excerpt: 'Thousands of innovators and entrepreneurs gather in Kigali to showcase cutting-edge African technology solutions.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Tanzania\'s Tourism Industry Bounces Back Stronger',
    slug: 'tanzania-tourism-recovery',
    excerpt: 'Record visitor numbers to Mount Kilimanjaro and Serengeti signal strong recovery in the tourism sector.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=450&fit=crop',
  },
  {
    title: 'Senegal Leads West Africa in Digital Innovation',
    slug: 'senegal-digital-innovation',
    excerpt: 'Government initiatives and private investment create fertile ground for tech startups and digital entrepreneurs.',
    category: 'technology',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Uganda\'s Healthcare System Gets AI Boost',
    slug: 'uganda-healthcare-ai',
    excerpt: 'Artificial intelligence tools are improving disease diagnosis and patient outcomes across rural health centers.',
    category: 'health',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800&h=450&fit=crop',
  },
  {
    title: 'Botswana Diversifies Economy Beyond Diamonds',
    slug: 'botswana-economic-diversification',
    excerpt: 'Strategic investments in technology and tourism sectors reduce dependence on diamond mining.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  },
  {
    title: 'Morocco\'s Green Energy Ambitions Take Shape',
    slug: 'morocco-green-energy',
    excerpt: 'Massive solar farm projects position Morocco as a renewable energy leader in North Africa.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e938aa1ef14?w=800&h=450&fit=crop',
  },
  {
    title: 'Angola\'s Oil Sector Modernization Underway',
    slug: 'angola-oil-modernization',
    excerpt: 'Investment in new technology aims to increase efficiency and reduce environmental impact of oil production.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&h=450&fit=crop',
  },
  {
    title: 'Ivory Coast Becomes Africa\'s Cocoa Tech Hub',
    slug: 'ivory-coast-cocoa-tech',
    excerpt: 'Blockchain technology and IoT devices revolutionize cocoa production and supply chain management.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Cameroon\'s Film Industry Gains International Recognition',
    slug: 'cameroon-film-industry',
    excerpt: 'African cinema gains prominence as Cameroonian filmmakers win awards at major international festivals.',
    category: 'culture',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
  },
  {
    title: 'Zambia\'s Copper Mining Sector Attracts New Investment',
    slug: 'zambia-copper-mining',
    excerpt: 'Global demand for copper drives expansion of mining operations and job creation across the country.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&h=450&fit=crop',
  },
  {
    title: 'Zimbabwe\'s Agricultural Innovation Feeds the Nation',
    slug: 'zimbabwe-agricultural-innovation',
    excerpt: 'Modern farming techniques and technology help Zimbabwe achieve food security and export surplus.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop',
  },
  {
    title: 'Malawi\'s Education System Embraces Digital Learning',
    slug: 'malawi-digital-education',
    excerpt: 'Technology initiatives bring quality education to remote areas and improve student outcomes nationwide.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=450&fit=crop',
  },
  {
    title: 'Mauritius Strengthens Position as Financial Hub',
    slug: 'mauritius-financial-hub',
    excerpt: 'Strategic policies and infrastructure investments solidify Mauritius\'s role in African finance.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
  },
  {
    title: 'Benin\'s Port Becomes Gateway to West Africa',
    slug: 'benin-port-expansion',
    excerpt: 'Infrastructure upgrades position Benin\'s port as a major trade hub for the entire West African region.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&h=450&fit=crop',
  },
  {
    title: 'Liberia\'s Healthcare Workers Trained in Latest Techniques',
    slug: 'liberia-healthcare-training',
    excerpt: 'International partnerships bring advanced medical training to Liberian healthcare professionals.',
    category: 'health',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800&h=450&fit=crop',
  },
  {
    title: 'Sierra Leone\'s Youth Entrepreneurship Program Succeeds',
    slug: 'sierra-leone-youth-entrepreneurs',
    excerpt: 'Government-backed initiative empowers young people to start businesses and create employment.',
    category: 'business',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Guinea\'s Mining Sector Implements Sustainability Standards',
    slug: 'guinea-mining-sustainability',
    excerpt: 'New environmental regulations ensure responsible mining practices and community protection.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e938aa1ef14?w=800&h=450&fit=crop',
  },
  {
    title: 'Burkina Faso\'s Agricultural Exports Reach New Markets',
    slug: 'burkina-faso-agricultural-exports',
    excerpt: 'Quality improvements and trade agreements open doors to international markets for local farmers.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=450&fit=crop',
  },
  {
    title: 'Mali\'s Cultural Heritage Attracts Global Tourism',
    slug: 'mali-cultural-tourism',
    excerpt: 'Ancient sites and vibrant traditions draw visitors from around the world to Mali.',
    category: 'culture',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
  },
  {
    title: 'Niger\'s Youth Population Drives Innovation Wave',
    slug: 'niger-youth-innovation',
    excerpt: 'Young entrepreneurs in Niger are creating solutions to local challenges with global impact.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop',
  },
  {
    title: 'Togo\'s Port Infrastructure Modernization Complete',
    slug: 'togo-port-modernization',
    excerpt: 'State-of-the-art facilities make Togo\'s port one of Africa\'s most efficient trade gateways.',
    category: 'business',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=800&h=450&fit=crop',
  },
  {
    title: 'Gabon\'s Rainforest Conservation Efforts Expand',
    slug: 'gabon-rainforest-conservation',
    excerpt: 'International partnerships support Gabon\'s mission to protect its vast rainforests and biodiversity.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=450&fit=crop',
  },
  {
    title: 'Congo\'s Hydroelectric Projects Power Economic Growth',
    slug: 'congo-hydroelectric-power',
    excerpt: 'Massive dam projects provide clean energy and attract manufacturing industries to the region.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1509391366360-2e938aa1ef14?w=800&h=450&fit=crop',
  },
]

async function seedArticles() {
  console.log('🌱 Seeding 30 mock articles...')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const client = postgres(connectionString)
  const db = drizzle(client)

  try {
    for (const article of mockArticles) {
      await db.insert(articles).values({
        ...article,
        body: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: article.excerpt || 'Article content goes here.',
                },
              ],
            },
          ],
        }),
        status: 'published',
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      })
    }

    console.log('✅ Successfully seeded 30 articles!')
    await client.end()
  } catch (error) {
    console.error('❌ Error seeding articles:', error)
    await client.end()
    process.exit(1)
  }
}

seedArticles()
