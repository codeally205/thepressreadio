import { db } from './lib/db/index.js'
import { users } from './lib/db/schema.js'
import { eq } from 'drizzle-orm'

const email = 'filalliance769@gmail.com'

console.log('🔍 Looking for user:', email)

const user = await db.query.users.findFirst({
  where: eq(users.email, email),
})

if (!user) {
  console.log('❌ User not found')
  process.exit(1)
}

console.log('✅ User found:', {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
})

if (user.role === 'admin') {
  console.log('ℹ️  User is already an admin')
  process.exit(0)
}

console.log('📝 Updating user to admin...')

await db.update(users)
  .set({ role: 'admin' })
  .where(eq(users.id, user.id))

console.log('✅ User is now an admin!')

// Verify the update
const updatedUser = await db.query.users.findFirst({
  where: eq(users.email, email),
})

console.log('✅ Verified:', {
  email: updatedUser.email,
  role: updatedUser.role
})

process.exit(0)
