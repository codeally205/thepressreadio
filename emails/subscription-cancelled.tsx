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

interface SubscriptionCancelledEmailProps {
  name?: string
  plan: string
  accessEndsAt: Date
  reason?: string
}

export default function SubscriptionCancelledEmail({
  name = 'Valued Reader',
  plan,
  accessEndsAt,
  reason,
}: SubscriptionCancelledEmailProps) {
  const planName = plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Html>
      <Head />
      <Preview>
        Your subscription has been cancelled - We're sorry to see you go
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Subscription Cancelled</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            We've processed your cancellation request for <strong>{planName}</strong>. 
            We're sorry to see you go!
          </Text>

          <Text style={text}>
            Your premium access will continue until <strong>{accessEndsAt.toLocaleDateString()}</strong>. 
            After that date, you'll still be able to read our free articles and access limited content.
          </Text>

          {reason && (
            <Text style={text}>
              <strong>Cancellation reason:</strong> {reason}
            </Text>
          )}

          <Text style={text}>
            If you change your mind, you can resubscribe anytime to regain full access to our 
            premium content and support quality African journalism.
          </Text>

          <Text style={text}>
            <Link href={`${process.env.NEXTAUTH_URL}/subscribe`} style={link}>
              Resubscribe anytime
            </Link>
          </Text>

          <Text style={text}>
            Thank you for your past support. We hope you'll consider rejoining us in the future.
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