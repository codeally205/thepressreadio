import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

const email = process.argv[2] || 'emmabyiringiro215@gmail.com'

const users = await sql`
  SELECT id, email, name 
  FROM "user" 
  WHERE email = ${email}
`

if (users.length > 0) {
  console.log('✅ User exists:')
  console.log(users[0])
} else {
  console.log('❌ User NOT found:', email)
  console.log('\nCreating user...')
  
  const newUser = await sql`
    INSERT INTO "user" (email, name, auth_provider)
    VALUES (${email}, 'Emmanuel Byiringiro', 'email')
    RETURNING id, email, name
  `
  
  console.log('✅ User created:')
  console.log(newUser[0])
}

await sql.end()
