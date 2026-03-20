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

interface PaymentFailedEmailProps {
  name?: string
  plan: string
  amount: number
  currency: string
  retryUrl?: string
  nextAttemptDate?: Date
}

export default function PaymentFailedEmail({
  name = 'Valued Reader',
  plan,
  amount,
  currency,
  retryUrl,
  nextAttemptDate,
}: PaymentFailedEmailProps) {
  const planName = plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)

  return (
    <Html>
      <Head />
      <Preview>
        Payment failed - Please update your payment method to continue your subscription
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Failed</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            We were unable to process your payment of <strong>{formattedAmount}</strong> for 
            your <strong>{planName}</strong> subscription.
          </Text>

          <Text style={text}>
            This could be due to:
          </Text>
          
          <ul style={list}>
            <li>Insufficient funds in your account</li>
            <li>An expired or cancelled payment method</li>
            <li>Your bank declining the transaction</li>
            <li>Incorrect billing information</li>
          </ul>

          <Text style={text}>
            <strong>What happens next?</strong>
          </Text>

          <Text style={text}>
            {nextAttemptDate ? (
              <>We'll automatically retry your payment on <strong>{nextAttemptDate.toLocaleDateString()}</strong>. 
              In the meantime, your access to premium content will continue.</>
            ) : (
              'Please update your payment method as soon as possible to avoid any interruption to your service.'
            )}
          </Text>

          {retryUrl && (
            <Text style={text}>
              <Link href={retryUrl} style={link}>
                Update your payment method
              </Link>
            </Text>
          )}

          <Text style={text}>
            <Link href={`${process.env.NEXTAUTH_URL}/account`} style={link}>
              Manage your subscription
            </Link>
          </Text>

          <Text style={text}>
            If you continue to experience issues, please contact our support team and we'll be happy to help.
          </Text>

          <Text style={footer}>
            Questions? Reply to this email or contact our support team.
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
  color: '#dc2626',
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

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '26px',
  paddingLeft: '20px',
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