#!/usr/bin/env node

import crypto from 'crypto'

// Generate a random webhook secret for testing
const webhookSecret = 'whsec_' + crypto.randomBytes(32).toString('hex')

console.log('Generated Stripe Webhook Secret for testing:')
console.log(webhookSecret)
console.log('\nAdd this to your .env file:')
console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`)
console.log('\nNote: This is for local testing only. For production, use the actual webhook secret from your Stripe dashboard.')