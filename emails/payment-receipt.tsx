import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'

interface PaymentReceiptEmailProps {
  name?: string
  plan: string
  amount: number
  currency: string
  nextBillingDate: Date
  invoiceUrl?: string
}

export default function PaymentReceiptEmail({
  name = 'Valued Reader',
  plan,
  amount,
  currency,
  nextBillingDate,
  invoiceUrl,
}: PaymentReceiptEmailProps) {
  const planName = plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)

  return (
    <Html>
      <Head />
      <Preview>
        Payment received - Thank you for your continued support
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Received</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Thank you! We've successfully processed your payment for <strong>{planName}</strong>.
          </Text>

          <div style={receiptBox}>
            <Text style={receiptTitle}>Payment Details</Text>
            <Text style={receiptItem}>Plan: <strong>{planName}</strong></Text>
            <Text style={receiptItem}>Amount: <strong>{formattedAmount}</strong></Text>
            <Text style={receiptItem}>
              Next billing date: <strong>{nextBillingDate.toLocaleDateString()}</strong>
            </Text>
          </div>

          {invoiceUrl && (
            <Text style={text}>
              <Link href={invoiceUrl} style={link}>
                Download your invoice
              </Link>
            </Text>
          )}

          <Text style={text}>
            Your subscription is active and you have unlimited access to all premium content.
          </Text>

          <Text style={text}>
            <Link href={`${process.env.NEXTAUTH_URL}/account`} style={link}>
              Manage your subscription
            </Link>
          </Text>

          <Text style={text}>
            Thank you for supporting quality African journalism!
          </Text>

          <Text style={footer}>
            Questions about your payment? Reply to this email or contact our support team.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#000000',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
}

const receiptBox = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6',
  borderRadius: '4px',
  padding: '20px',
  margin: '20px 0',
}

const receiptTitle = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const receiptItem = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const link = {
  color: '#000000',
  textDecoration: 'underline',
}

const footer = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
}