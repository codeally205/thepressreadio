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

interface SubscriptionWelcomeEmailProps {
  name?: string
  plan: string
  trialEndsAt?: Date
}

export default function SubscriptionWelcomeEmail({
  name = 'Valued Reader',
  plan,
  trialEndsAt,
}: SubscriptionWelcomeEmailProps) {
  const isTrialing = !!trialEndsAt
  const planName = plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to your {planName} subscription - Your premium access starts now!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to ThePressRadio!</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Thank you for subscribing to our <strong>{planName}</strong>! 
            {isTrialing 
              ? ` Your 14-day free trial has started and you now have unlimited access to all our premium content.`
              : ' You now have unlimited access to all our premium content.'
            }
          </Text>

          {isTrialing && (
            <Text style={text}>
              Your trial period ends on <strong>{trialEndsAt.toLocaleDateString()}</strong>. 
              After that, you'll be charged automatically unless you cancel before then.
            </Text>
          )}

          <Text style={text}>
            With your subscription, you get:
          </Text>
          
          <ul style={list}>
            <li>Unlimited access to premium articles</li>
            <li>Ad-free reading experience</li>
            <li>Weekly newsletter with exclusive insights</li>
            <li>Support for quality African journalism</li>
          </ul>

          <Text style={text}>
            <Link href={`${process.env.NEXTAUTH_URL}/account`} style={link}>
              Manage your subscription
            </Link>
          </Text>

          <Text style={text}>
            Start exploring our premium content at{' '}
            <Link href={process.env.NEXTAUTH_URL} style={link}>
              ThePressRadio
            </Link>
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