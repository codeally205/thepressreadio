import { resend } from './resend'
import SubscriptionWelcomeEmail from '@/emails/subscription-welcome'
import TrialReminderEmail from '@/emails/trial-reminder'
import PaymentReceiptEmail from '@/emails/payment-receipt'
import SubscriptionCancelledEmail from '@/emails/subscription-cancelled'
import PaymentFailedEmail from '@/emails/payment-failed'

export async function sendSubscriptionWelcomeEmail({
  email,
  name,
  plan,
  trialEndsAt,
}: {
  email: string
  name?: string
  plan: string
  trialEndsAt?: Date
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Welcome to ThePressRadio - Your premium access starts now!',
      react: SubscriptionWelcomeEmail({ name, plan, trialEndsAt }),
    })
  } catch (error) {
    console.error('Failed to send subscription welcome email:', error)
  }
}

export async function sendTrialReminderEmail({
  email,
  name,
  plan,
  trialEndsAt,
  daysLeft,
}: {
  email: string
  name?: string
  plan: string
  trialEndsAt: Date
  daysLeft: number
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `Your free trial ends in ${daysLeft} days - Continue your premium access`,
      react: TrialReminderEmail({ name, plan, trialEndsAt, daysLeft }),
    })
  } catch (error) {
    console.error('Failed to send trial reminder email:', error)
  }
}

export async function sendPaymentReceiptEmail({
  email,
  name,
  plan,
  amount,
  currency,
  nextBillingDate,
  invoiceUrl,
}: {
  email: string
  name?: string
  plan: string
  amount: number
  currency: string
  nextBillingDate: Date
  invoiceUrl?: string
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Payment received - Thank you for your continued support',
      react: PaymentReceiptEmail({ name, plan, amount, currency, nextBillingDate, invoiceUrl }),
    })
  } catch (error) {
    console.error('Failed to send payment receipt email:', error)
  }
}

export async function sendSubscriptionCancelledEmail({
  email,
  name,
  plan,
  accessEndsAt,
  reason,
}: {
  email: string
  name?: string
  plan: string
  accessEndsAt: Date
  reason?: string
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Your subscription has been cancelled - We\'re sorry to see you go',
      react: SubscriptionCancelledEmail({ name, plan, accessEndsAt, reason }),
    })
  } catch (error) {
    console.error('Failed to send subscription cancelled email:', error)
  }
}

export async function sendPaymentFailedEmail({
  email,
  name,
  plan,
  amount,
  currency,
  retryUrl,
  nextAttemptDate,
}: {
  email: string
  name?: string
  plan: string
  amount: number
  currency: string
  retryUrl?: string
  nextAttemptDate?: Date
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Payment failed - Please update your payment method',
      react: PaymentFailedEmail({ name, plan, amount, currency, retryUrl, nextAttemptDate }),
    })
  } catch (error) {
    console.error('Failed to send payment failed email:', error)
  }
}