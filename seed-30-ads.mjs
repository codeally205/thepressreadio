import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🌱 Seeding 30 ads for article sidebar...\n')

const adTemplates = [
  { title: 'Invest in African Markets', description: 'Discover investment opportunities across Africa. Start your journey to financial freedom today.', category: 'Finance' },
  { title: 'Premium Business News', description: 'Get exclusive insights into African business trends. Subscribe now for unlimited access.', category: 'Business' },
  { title: 'African Tech Summit 2026', description: 'Join Africa\'s largest tech conference. Network with innovators and investors.', category: 'Technology' },
  { title: 'Learn African Languages', description: 'Master Swahili, Yoruba, or Zulu with our interactive courses. Start learning today!', category: 'Education' },
  { title: 'African Fashion Week', description: 'Experience the best of African fashion. Get your tickets for the biggest fashion event.', category: 'Fashion' },
  { title: 'Real Estate in Lagos', description: 'Prime properties in Nigeria\'s commercial capital. Invest in Africa\'s fastest growing city.', category: 'Real Estate' },
  { title: 'Pan-African Trade Platform', description: 'Connect with suppliers and buyers across 54 countries. Expand your business reach.', category: 'Trade' },
  { title: 'African Music Festival', description: 'Celebrate African music and culture. Three days of unforgettable performances.', category: 'Entertainment' },
  { title: 'Renewable Energy Solutions', description: 'Solar power for African homes and businesses. Clean energy, lower costs.', category: 'Energy' },
  { title: 'African Startup Accelerator', description: 'Turn your idea into a thriving business. Apply for funding and mentorship.', category: 'Startups' },
  { title: 'Healthcare Innovation', description: 'Revolutionary telemedicine platform for Africa. Quality healthcare, anywhere.', category: 'Healthcare' },
  { title: 'Agricultural Technology', description: 'Smart farming solutions for African farmers. Increase yields, reduce costs.', category: 'Agriculture' },
  { title: 'African Art Gallery', description: 'Discover contemporary African art. Buy original pieces from emerging artists.', category: 'Art' },
  { title: 'Mobile Banking Revolution', description: 'Banking made simple for everyone. Open an account in minutes.', category: 'Fintech' },
  { title: 'African Tourism Board', description: 'Explore Africa\'s hidden gems. Plan your next adventure with expert guides.', category: 'Tourism' },
  { title: 'E-Commerce Platform', description: 'Shop from thousands of African vendors. Fast delivery, secure payments.', category: 'E-commerce' },
  { title: 'African Film Festival', description: 'Celebrating African cinema. Watch award-winning films from across the continent.', category: 'Film' },
  { title: 'Logistics & Shipping', description: 'Fast, reliable delivery across Africa. Track your shipments in real-time.', category: 'Logistics' },
  { title: 'African Sports League', description: 'Follow your favorite teams and players. Live scores, news, and highlights.', category: 'Sports' },
  { title: 'Education Technology', description: 'Online learning platform for African students. Quality education, affordable prices.', category: 'EdTech' },
  { title: 'African Food Delivery', description: 'Your favorite meals delivered fast. Order from top restaurants near you.', category: 'Food' },
  { title: 'Insurance Solutions', description: 'Protect what matters most. Affordable insurance for African families.', category: 'Insurance' },
  { title: 'African Book Club', description: 'Discover African literature. Join thousands of readers across the continent.', category: 'Books' },
  { title: 'Cryptocurrency Exchange', description: 'Buy, sell, and trade crypto safely. Africa\'s most trusted platform.', category: 'Crypto' },
  { title: 'African Wedding Planners', description: 'Make your special day unforgettable. Expert planning, stunning venues.', category: 'Events' },
  { title: 'Fitness & Wellness', description: 'Transform your health with African fitness experts. Online classes and coaching.', category: 'Fitness' },
  { title: 'African Car Marketplace', description: 'Buy and sell vehicles across Africa. Verified sellers, fair prices.', category: 'Automotive' },
  { title: 'Legal Services Online', description: 'Access legal advice from African lawyers. Affordable, professional, confidential.', category: 'Legal' },
  { title: 'African Dating App', description: 'Find your perfect match. Connect with singles across Africa.', category: 'Dating' },
  { title: 'Cloud Services Africa', description: 'Enterprise cloud solutions for African businesses. Secure, scalable, affordable.', category: 'Cloud' },
]

const images = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  'https://images.unsplash.com/photo-1558769132-cb1aea1f1f57?w=800',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
  'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
]

const buttonTexts = ['Learn More', 'Get Started', 'Sign Up Now', 'Join Today', 'Discover More', 'Try Free', 'Register Now', 'Shop Now', 'Book Now', 'Apply Now']

try {
  for (let i = 0; i < 30; i++) {
    const template = adTemplates[i % adTemplates.length]
    const image = images[i % images.length]
    const buttonText = buttonTexts[i % buttonTexts.length]
    const priority = 100 - i // Descending priority
    
    await sql`
      INSERT INTO ads (
        title, description, image_url, link_url, button_text,
        position, target_audience, status, priority
      ) VALUES (
        ${template.title},
        ${template.description},
        ${image},
        ${'https://example.com/' + template.category.toLowerCase()},
        ${buttonText},
        'sidebar',
        'unsubscribed',
        'active',
        ${priority}
      )
    `
    console.log(`✅ ${i + 1}/30: ${template.title}`)
  }
  
  console.log(`\n🎉 Successfully seeded 30 ads!`)
  
  // Show total count
  const total = await sql`SELECT COUNT(*) as count FROM ads WHERE position = 'sidebar'`
  console.log(`📊 Total sidebar ads in database: ${total[0].count}`)
  
  await sql.end()
} catch (error) {
  console.error('❌ Error:', error.message)
  await sql.end()
  process.exit(1)
}
