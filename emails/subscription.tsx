import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

interface SubscriptionEmailProps {
  name?: string
  plan: string
  trialEndsAt?: Date
}

export default function SubscriptionEmail({ name, plan, trialEndsAt }: SubscriptionEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
        <Container style={{ padding: '20px' }}>
          <Heading style={{ color: '#000000' }}>Subscription Confirmed</Heading>
          <Text>Hi {name || 'there'},</Text>
          <Text>
            Your subscription to ThePressRadio has been confirmed.
          </Text>
          <Text>Plan: {plan}</Text>
          {trialEndsAt && (
            <Text>Your 14-day free trial ends on {trialEndsAt.toLocaleDateString()}.</Text>
          )}
          <Button
            href={`${process.env.NEXTAUTH_URL}/account`}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '12px 24px',
              textDecoration: 'none',
            }}
          >
            Manage Subscription
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
