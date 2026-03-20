const crypto = require('crypto');

/**
 * Generate Paystack webhook signature for testing
 * Usage: node generate-paystack-signature.js
 */

// Use environment variable or throw error if not set
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ PAYSTACK_SECRET_KEY environment variable is required');
  console.log('Set it in your .env file or run: set PAYSTACK_SECRET_KEY=your_secret_key');
  process.exit(1);
}

// Sample webhook payloads for testing
const webhookPayloads = {
  subscriptionCreate: {
    event: "subscription.create",
    data: {
      subscription_code: "SUB_test123",
      customer: {
        email: "test@example.com",
        customer_code: "CUS_test123"
      },
      plan: {
        name: "continent_monthly"
      },
      next_payment_date: "2026-04-17T00:00:00.000Z",
      reference: "test_ref_123"
    }
  },
  chargeSuccess: {
    event: "charge.success",
    data: {
      reference: "test_ref_456",
      amount: 100,
      currency: "USD",
      plan: {
        name: "continent_monthly"
      },
      customer: {
        email: "test@example.com",
        customer_code: "CUS_test123"
      }
    }
  },
  subscriptionDisable: {
    event: "subscription.disable",
    data: {
      subscription_code: "SUB_test123",
      customer: {
        email: "test@example.com"
      },
      plan: {
        name: "continent_monthly"
      },
      reference: "test_ref_789"
    }
  }
};

function generateSignature(payload) {
  const body = JSON.stringify(payload);
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');
  
  return {
    body,
    signature: hash,
    headers: {
      'Content-Type': 'application/json',
      'x-paystack-signature': hash
    }
  };
}

console.log('=== PAYSTACK WEBHOOK SIGNATURE GENERATOR ===\n');

Object.entries(webhookPayloads).forEach(([name, payload]) => {
  console.log(`${name.toUpperCase()}:`);
  const result = generateSignature(payload);
  console.log('Body:', result.body);
  console.log('Signature:', result.signature);
  console.log('Headers:', JSON.stringify(result.headers, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');
});

// Function to generate signature for custom payload
function generateCustomSignature(customPayload) {
  return generateSignature(customPayload);
}

module.exports = { generateSignature, generateCustomSignature };