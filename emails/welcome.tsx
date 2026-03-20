import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components'

interface WelcomeEmailProps {
  name?: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
        <Container style={{ padding: '20px' }}>
          <Heading style={{ color: '#000000' }}>Welcome to ThePressRadio</Heading>
          <Text>Hi {name || 'there'},</Text>
          <Text>
            Thank you for joining ThePressRadio. We're excited to have you as part of our community.
          </Text>
          <Text>
            Explore our latest articles and stay informed about news across the African continent.
          </Text>
          <Button
            href={process.env.NEXTAUTH_URL}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '12px 24px',
              textDecoration: 'none',
            }}
          >
            Start Reading
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
