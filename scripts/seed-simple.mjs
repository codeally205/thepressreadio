import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const mockArticles = [
  {
    title: 'African Tech Startups Raise Record $2.5 Billion in 2024',
    slug: 'african-tech-startups-record-funding',
    excerpt: 'Investment in African technology companies reaches unprecedented levels as venture capitalists recognize the continent\'s potential.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
  },
  {
    title: 'Nigeria\'s Economy Shows Signs of Recovery Amid Global Uncertainty',
    slug: 'nigeria-economy-recovery',
    excerpt: 'Economic indicators suggest Nigeria is bouncing back from recent challenges with improved GDP growth and inflation control.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop',
  },
  {
    title: 'South Africa\'s Renewable Energy Revolution Accelerates',
    slug: 'south-africa-renewable-energy',
    excerpt: 'New solar and wind projects promise to transform South Africa\'s energy landscape and reduce dependence on coal.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
  },
  {
    title: 'Kenya\'s Tech Hub Becomes Africa\'s Silicon Valley',
    slug: 'kenya-tech-hub-silicon-valley',
    excerpt: 'Nairobi\'s thriving startup ecosystem attracts global investors and talented entrepreneurs from across the continent.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=450&fit=crop',
  },
  {
    title: 'Ghana\'s Gold Production Reaches 10-Year High',
    slug: 'ghana-gold-production-high',
    excerpt: 'Mining sector expansion drives economic growth as Ghana solidifies its position as a major gold producer.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
  },
  {
    title: 'African Union Launches Continental Free Trade Initiative',
    slug: 'african-union-free-trade',
    excerpt: 'New trade agreement aims to boost intra-African commerce and create millions of jobs across the continent.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=450&fit=crop',
  },
  {
    title: 'Ethiopia\'s Digital Transformation Reshapes Banking Sector',
    slug: 'ethiopia-digital-banking',
    excerpt: 'Mobile banking and fintech innovations are bringing financial services to millions of previously unbanked Ethiopians.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop',
  },
  {
    title: 'Rwanda Hosts Africa\'s Largest Tech Conference',
    slug: 'rwanda-tech-conference',
    excerpt: 'Thousands of innovators and entrepreneurs gather in Kigali to showcase cutting-edge African technology solutions.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
  },
  {
    title: 'Tanzania\'s Tourism Industry Bounces Back Stronger',
    slug: 'tanzania-tourism-recovery',
    excerpt: 'Record visitor numbers to Mount Kilimanjaro and Serengeti signal strong recovery in the tourism sector.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=450&fit=crop',
  },
  {
    title: 'Senegal Leads West Africa in Digital Innovation',
    slug: 'senegal-digital-innovation',
    excerpt: 'Government initiatives and private investment create fertile ground for tech startups and digital entrepreneurs.',
    category: 'technology',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=450&fit=crop',
  },
  {
    title: 'Uganda\'s Healthcare System Gets AI Boost',
    slug: 'uganda-healthcare-ai',
    excerpt: 'Artificial intelligence tools are improving disease diagnosis and patient outcomes across rural health centers.',
    category: 'health',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
  },
  {
    title: 'Botswana Diversifies Economy Beyond Diamonds',
    slug: 'botswana-economic-diversification',
    excerpt: 'Strategic investments in technology and tourism sectors reduce dependence on diamond mining.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop',
  },
  {
    title: 'Morocco\'s Green Energy Ambitions Take Shape',
    slug: 'morocco-green-energy',
    excerpt: 'Massive solar farm projects position Morocco as a renewable energy leader in North Africa.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=450&fit=crop',
  },
  {
    title: 'Angola\'s Oil Sector Modernization Underway',
    slug: 'angola-oil-modernization',
    excerpt: 'Investment in new technology aims to increase efficiency and reduce environmental impact of oil production.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=450&fit=crop',
  },
  {
    title: 'Ivory Coast Becomes Africa\'s Cocoa Tech Hub',
    slug: 'ivory-coast-cocoa-tech',
    excerpt: 'Blockchain technology and IoT devices revolutionize cocoa production and supply chain management.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
  },
  {
    title: 'Cameroon\'s Film Industry Gains International Recognition',
    slug: 'cameroon-film-industry',
    excerpt: 'African cinema gains prominence as Cameroonian filmmakers win awards at major international festivals.',
    category: 'culture',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop',
  },
  {
    title: 'Zambia\'s Copper Mining Sector Attracts New Investment',
    slug: 'zambia-copper-mining',
    excerpt: 'Global demand for copper drives expansion of mining operations and job creation across the country.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=450&fit=crop',
  },
  {
    title: 'Zimbabwe\'s Agricultural Innovation Feeds the Nation',
    slug: 'zimbabwe-agricultural-innovation',
    excerpt: 'Modern farming techniques and technology help Zimbabwe achieve food security and export surplus.',
    category: 'environment',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=450&fit=crop',
  },
  {
    title: 'Malawi\'s Education System Embraces Digital Learning',
    slug: 'malawi-digital-education',
    excerpt: 'Technology initiatives bring quality education to remote areas and improve student outcomes nationwide.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop',
  },
  {
    title: 'Mauritius Strengthens Position as Financial Hub',
    slug: 'mauritius-financial-hub',
    excerpt: 'Strategic policies and infrastructure investments solidify Mauritius\'s role in African finance.',
    category: 'economy',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=450&fit=crop',
  },
  {
    title: 'Benin\'s Port Becomes Gateway to West Africa',
    slug: 'benin-port-expansion',
    excerpt: 'Infrastructure upgrades position Benin\'s port as a major trade hub for the entire West African region.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&h=450&fit=crop',
  },
  {
    title: 'Liberia\'s Healthcare Workers Trained in Latest Techniques',
    slug: 'liberia-healthcare-training',
    excerpt: 'International partnerships bring advanced medical training to Liberian healthcare professionals.',
    category: 'health',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&h=450&fit=crop',
  },
  {
    title: 'Sierra Leone\'s Youth Entrepreneurship Program Succeeds',
    slug: 'sierra-leone-youth-entrepreneurs',
    excerpt: 'Government-backed initiative empowers young people to start businesses and create employment.',
    category: 'business',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=450&fit=crop',
  },
  {
    title: 'Guinea\'s Mining Sector Implements Sustainability Standards',
    slug: 'guinea-mining-sustainability',
    excerpt: 'New environmental regulations ensure responsible mining practices and community protection.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=450&fit=crop',
  },
  {
    title: 'Burkina Faso\'s Agricultural Exports Reach New Markets',
    slug: 'burkina-faso-agricultural-exports',
    excerpt: 'Quality improvements and trade agreements open doors to international markets for local farmers.',
    category: 'business',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&h=450&fit=crop',
  },
  {
    title: 'Mali\'s Cultural Heritage Attracts Global Tourism',
    slug: 'mali-cultural-tourism',
    excerpt: 'Ancient sites and vibrant traditions draw visitors from around the world to Mali.',
    category: 'culture',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&h=450&fit=crop',
  },
  {
    title: 'Niger\'s Youth Population Drives Innovation Wave',
    slug: 'niger-youth-innovation',
    excerpt: 'Young entrepreneurs in Niger are creating solutions to local challenges with global impact.',
    category: 'technology',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop',
  },
  {
    title: 'Togo\'s Port Infrastructure Modernization Complete',
    slug: 'togo-port-modernization',
    excerpt: 'State-of-the-art facilities make Togo\'s port one of Africa\'s most efficient trade gateways.',
    category: 'business',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?w=800&h=450&fit=crop',
  },
  {
    title: 'Gabon\'s Rainforest Conservation Efforts Expand',
    slug: 'gabon-rainforest-conservation',
    excerpt: 'International partnerships support Gabon\'s mission to protect its vast rainforests and biodiversity.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&h=450&fit=crop',
  },
  {
    title: 'Congo\'s Hydroelectric Projects Power Economic Growth',
    slug: 'congo-hydroelectric-power',
    excerpt: 'Massive dam projects provide clean energy and attract manufacturing industries to the region.',
    category: 'environment',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop',
  },
]

async function seedArticles() {
  console.log('🌱 Seeding 30 mock articles...')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = postgres(connectionString)

  try {
    for (const article of mockArticles) {
      const body = JSON.stringify({
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
      })

      const publishedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

      await sql`
        INSERT INTO articles (
          title, slug, excerpt, body, category, access_level, 
          status, cover_image_url, published_at, created_at, updated_at
        ) VALUES (
          ${article.title},
          ${article.slug},
          ${article.excerpt},
          ${body},
          ${article.category},
          ${article.accessLevel},
          'published',
          ${article.coverImageUrl},
          ${publishedAt},
          NOW(),
          NOW()
        )
        ON CONFLICT (slug) DO NOTHING
      `
    }

    console.log('✅ Successfully seeded 30 articles!')
    await sql.end()
  } catch (error) {
    console.error('❌ Error seeding articles:', error)
    await sql.end()
    process.exit(1)
  }
}

seedArticles()
