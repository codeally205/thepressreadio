/**
 * Enhanced webhook security utilities
 */

import { createHmac } from 'crypto'

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
  errorCode?: 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE' | 'MISSING_SECRET' | 'INVALID_JSON'
}

/**
 * Verify Paystack webhook signature with enhanced error handling
 */
export function verifyPaystackSignature(
  body: string, 
  signature: string | null
): WebhookValidationResult {
  if (!signature) {
    return {
      isValid: false,
      error: 'Missing x-paystack-signature header',
      errorCode: 'MISSING_SIGNATURE'
    }
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return {
      isValid: false,
      error: 'PAYSTACK_SECRET_KEY environment variable not configured',
      errorCode: 'MISSING_SECRET'
    }
  }

  try {
    const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')
    
    const isValid = hash === signature
    
    return {
      isValid,
      error: isValid ? undefined : 'Signature verification failed',
      errorCode: isValid ? undefined : 'INVALID_SIGNATURE'
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Signature verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorCode: 'INVALID_SIGNATURE'
    }
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse(jsonString: string): { success: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(jsonString)
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
    }
  }
}

/**
 * Sanitize webhook payload for logging (remove sensitive data)
 */
export function sanitizeWebhookPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload
  }

  const sensitiveFields = [
    'authorization',
    'card',
    'bank',
    'customer_code',
    'authorization_code',
    'bin',
    'last4',
    'exp_month',
    'exp_year',
    'phone',
    'metadata'
  ]

  const sanitized = { ...payload }

  function sanitizeObject(obj: any, path: string = ''): any {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    const result: any = Array.isArray(obj) ? [] : {}

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value, currentPath)
      } else {
        result[key] = value
      }
    }

    return result
  }

  return sanitizeObject(sanitized)
}

/**
 * Create structured error response for webhooks
 */
export function createWebhookErrorResponse(
  error: string,
  statusCode: number = 400,
  details?: any
) {
  const response = {
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }

  return {
    response,
    statusCode
  }
}