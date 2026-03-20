import postgres from 'postgres'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config({ path: '.env' })

const politicsArticles = [
  {
    title: 'I decided to move out of the house',
    slug: 'decided-move-out-house',
    excerpt: 'Quo natum nemore putant in, his te case habemus. Nulla detraxit explicari vis id errem tantas tempor. Solet quidam salutatus.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d4?w=800&h=600&fit=crop',
  },
  {
    title: 'New York, this is your last chance',
    slug: 'new-york-last-chance',
    excerpt: 'Quo natum nemore putant in, his te case habemus. Nulla detraxit explicari vis id errem tantas tempor.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=450&fit=crop',
  },
  {
    title: 'Helping to Protect the Okavango Basin',
    slug: 'protecting-okavango-basin',
    excerpt: 'Labore nonumes te vel, vis id errem tantas tempor. Solet quidam salutatus per in recusabo facilisis.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop',
  },
  {
    title: 'An Old Man Telling Me about Wars',
    slug: 'old-man-telling-wars',
    excerpt: 'Ius ea rebum nostrum offendit. Per in recusabo facilisis, est ei choro mandamus mnesarchum te.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&h=450&fit=crop',
  },
  {
    title: 'Enter at your peril, past the vault door',
    slug: 'enter-peril-vault-door',
    excerpt: 'Duo dolorum mandamus mnesarchum te. Sit ridens persius ex. Vel noluisse perpetua mandamus.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=450&fit=crop',
  },
  {
    title: 'Democratic Elections Reshape Continental Politics',
    slug: 'democratic-elections-reshape-politics',
    excerpt: 'Recent electoral victories across multiple African nations signal a shift toward more democratic governance and youth participation.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop',
  },
  {
    title: 'Regional Security Alliance Strengthens Border Control',
    slug: 'regional-security-alliance-borders',
    excerpt: 'West African nations collaborate on enhanced security measures to combat cross-border threats and improve regional stability.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop',
  },
  {
    title: 'Constitutional Reforms Advance Across the Continent',
    slug: 'constitutional-reforms-advance',
    excerpt: 'Multiple African countries pursue constitutional amendments to strengthen democratic institutions and protect civil liberties.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=450&fit=crop',
  },
  {
    title: 'Youth Political Movements Gain Momentum',
    slug: 'youth-political-movements-momentum',
    excerpt: 'Young African leaders organize grassroots campaigns demanding greater representation and accountability from government officials.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop',
  },
  {
    title: 'Anti-Corruption Campaigns Show Promising Results',
    slug: 'anti-corruption-campaigns-results',
    excerpt: 'Government transparency initiatives and judicial reforms demonstrate measurable progress in reducing corruption across key sectors.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
  },
  {
    title: 'Parliamentary Debates Shape Economic Policy',
    slug: 'parliamentary-debates-economic-policy',
    excerpt: 'Legislative sessions across Africa focus on economic reforms and infrastructure development to boost continental growth.',
    category: 'politics',
    accessLevel: 'free',
    coverImageUrl: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=800&h=450&fit=crop',
  },
  {
    title: 'International Diplomacy Strengthens African Unity',
    slug: 'international-diplomacy-african-unity',
    excerpt: 'Continental leaders engage in strategic partnerships with global powers while maintaining African sovereignty and interests.',
    category: 'politics',
    accessLevel: 'premium',
    coverImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop',
  },
]

async function seedPoliticsArticles() {
  console.log('🏛️ Seeding politics articles...')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set')
    process.exit(1)
  }

  const sql = postgres(connectionString)

  try {
    for (const article of politicsArticles) {
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

    console.log(`✅ Successfully seeded ${politicsArticles.length} politics articles!`)
    await sql.end()
  } catch (error) {
    console.error('❌ Error seeding politics articles:', error)
    await sql.end()
    process.exit(1)
  }
}

seedPoliticsArticles()