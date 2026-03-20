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

interface TrialReminderEmailProps {
  name?: string
  plan: string
  trialEndsAt: Date
  daysLeft: number
}

export default function TrialReminderEmail({
  name = 'Valued Reader',
  plan,
  trialEndsAt,
  daysLeft,
}: TrialReminderEmailProps) {
  const planName = plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <Html>
      <Head />
      <Preview>
        Your free trial ends in {daysLeft.toString()} days - Continue your premium access
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your trial ends soon</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Your 14-day free trial of <strong>{planName}</strong> ends in{' '}
            <strong>{daysLeft.toString()} day{daysLeft !== 1 ? 's' : ''}</strong> on{' '}
            <strong>{trialEndsAt.toLocaleDateString()}</strong>.
          </Text>

          <Text style={text}>
            We hope you've been enjoying unlimited access to our premium African news and analysis. 
            To continue reading without interruption, no action is needed - your subscription will 
            automatically continue after your trial ends.
          </Text>

          <Text style={text}>
            If you'd like to make any changes to your subscription or cancel, you can do so anytime 
            in your account settings.
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