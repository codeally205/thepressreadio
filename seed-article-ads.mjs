import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🌱 Seeding article sidebar ads...\n')

const ads = [
  {
    title: 'Invest in African Markets',
    description: 'Discover investment opportunities across Africa. Start your journey to financial freedom today.',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    link_url: 'https://example.com/invest',
    button_text: 'Start Investing',
    position: 'sidebar',
    target_audience: 'unsubscribed',
    status: 'active',
    priority: 100
  },
  {
    title: 'Premium Business News',
    description: 'Get exclusive insights into African business trends. Subscribe now for unlimited access.',
    image_url: 'https://images.unsplash.com/photo--1454165804606-c3d57bc86b40?w=800',
    link_url: 'https://example.com/subscribe',
    button_text: 'Subscribe Now',
    position: 'sidebar',
    target_audience: 'unsubscribed',
    status: 'active',
    priority: 90
  },
  {
    title: 'African Tech Summit 2026',
    description: 'Join Africa\'s largest tech conference. Network with innovators and investors.',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    link_url: 'https://example.com/summit',
    button_text: 'Register Now',
    position: 'sidebar',
    target_audience: 'unsubscribed',
    status: 'active',
    priority: 80
  },
  {
    title: 'Learn African Languages',
    description: 'Master Swahili, Yoruba, or Zulu with our interactive courses. Start learning today!',
    image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    link_url: 'https://example.com/languages',
    button_text: 'Start Learning',
    position: 'sidebar',
    target_audience: 'unsubscribed',
    status: 'active',
    priority: 70
  },
  {
    title: 'African Fashion Week',
    description: 'Experience the best of African fashion. Get your tickets for the biggest fashion event.',
    image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea1f1f57?w=800',
    link_url: 'https://example.com/fashion',
    button_text: 'Get Tickets',
    position: 'sidebar',
    target_audience: 'unsubscribed',
    status: 'active',
    priority: 60
  }
]

try {
  for (const ad of ads) {
    await sql`
      INSERT INTO ads (
        title, description, image_url, link_url, button_text,
        position, target_audience, status, priority
      ) VALUES (
        ${ad.title}, ${ad.description}, ${ad.image_url}, ${ad.link_url}, ${ad.button_text},
        ${ad.position}, ${ad.target_audience}, ${ad.status}, ${ad.priority}
      )
    `
    console.log(`✅ Created ad: ${ad.title}`)
  }
  
  console.log(`\n🎉 Successfully seeded ${ads.length} ads!`)
  
  await sql.end()
} catch (error) {
  console.error('❌ Error:', error.message)
  await sql.end()
  process.exit(1)
}
