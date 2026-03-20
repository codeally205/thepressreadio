export class PaystackClient {
  private secretKey: string
  private baseUrl = 'https://api.paystack.co'

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error(`Paystack API Error:`)
      console.error(`Status: ${response.status} ${response.statusText}`)
      console.error(`Endpoint: ${endpoint}`)
      console.error(`Response: ${responseText}`)
      
      let errorMessage = `${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(responseText)
        if (errorData.message) {
          errorMessage += `: ${errorData.message}`
        }
      } catch (e) {
        // Response is not JSON
      }
      
      throw new Error(`Paystack API error: ${errorMessage}`)
    }

    try {
      return JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse Paystack response as JSON:', responseText)
      throw new Error('Invalid JSON response from Paystack')
    }
  }

  async initializeTransaction(data: {
    email: string
    amount: number
    currency?: string
    customer?: string
    plan?: string
    callback_url?: string
    metadata?: any
  }) {
    return this.request('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async createCustomer(data: {
    email: string
    first_name?: string
    last_name?: string
    phone?: string
  }) {
    return this.request('/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async verifyTransaction(reference: string) {
    return this.request(`/transaction/verify/${reference}`)
  }

  async createSubscription(data: {
    customer: string
    plan: string
    authorization: string
  }) {
    return this.request('/subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async cancelSubscription(code: string, token: string) {
    return this.request('/subscription/disable', {
      method: 'POST',
      body: JSON.stringify({ code, token }),
    })
  }
}

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not set')
}

export const paystack = new PaystackClient(process.env.PAYSTACK_SECRET_KEY)
