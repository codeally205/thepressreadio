interface NewsletterTemplateProps {
  subject: string
  previewText?: string
  content: string
  logoUrl?: string
  unsubscribeUrl?: string
}

export default function NewsletterTemplate({
  subject,
  previewText,
  content,
  logoUrl = '/logo.png',
  unsubscribeUrl = '#'
}: NewsletterTemplateProps) {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px 30px 30px 30px',
        textAlign: 'center' as const,
        borderBottom: '3px solid #000000'
      }}>
        <img 
          src={logoUrl} 
          alt="ThePressRadio Logo" 
          style={{
            height: '80px',
            width: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '20px'
          }} 
        />
        <h1 style={{
          margin: '0',
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#000000'
        }}>
          ThePressRadio
        </h1>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '16px',
          color: '#666666',
          fontWeight: '500'
        }}>
          Pan-African Digital News Platform
        </p>
      </div>

      {/* Subject Line */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px 30px 30px 30px',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}>
        <h2 style={{
          margin: '0',
          fontFamily: 'Playfair Display, serif',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#000000',
          lineHeight: '1.3'
        }}>
          {subject}
        </h2>
        {previewText && (
          <p style={{
            margin: '15px 0 0 0',
            fontSize: '18px',
            color: '#555555',
            lineHeight: '1.5'
          }}>
            {previewText}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px 30px',
        lineHeight: '1.8',
        fontSize: '16px',
        color: '#333333'
      }}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '3px solid #000000',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        padding: '40px 30px',
        fontSize: '14px',
        textAlign: 'center' as const
      }}>
        <div style={{
          borderBottom: '2px solid #dee2e6',
          marginBottom: '30px'
        }}>
          <img 
            src={logoUrl} 
            alt="ThePressRadio Logo" 
            style={{
              height: '50px',
              width: 'auto',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '20px'
            }} 
          />
          <h3 style={{
            margin: '0 0 15px 0',
            fontFamily: 'Playfair Display, serif',
            fontSize: '22px',
            color: '#000000'
          }}>
            Stay Connected
          </h3>
          <p style={{
            margin: '0 0 25px 0',
            fontSize: '16px',
            color: '#555555',
            lineHeight: '1.5'
          }}>
            Follow us for the latest African news and insights
          </p>
          
          {/* Social Links */}
          <div style={{ marginBottom: '30px' }}>
            <a href="#" style={{
              color: '#000000',
              display: 'inline-block',
              margin: '0 8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '10px 20px',
              border: '2px solid #000000',
              borderRadius: '4px'
            }}>
              Website
            </a>
            <a href="#" style={{
              color: '#000000',
              display: 'inline-block',
              margin: '0 8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '10px 20px',
              border: '2px solid #000000',
              borderRadius: '4px'
            }}>
              Twitter
            </a>
            <a href="#" style={{
              color: '#000000',
              display: 'inline-block',
              margin: '0 8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '10px 20px',
              border: '2px solid #000000',
              borderRadius: '4px'
            }}>
              LinkedIn
            </a>
          </div>
        </div>

        {/* Subscription Info */}
        <div style={{
          fontSize: '12px',
          borderTop: '2px solid #dee2e6',
          paddingTop: '25px',
          lineHeight: '1.4',
          color: '#6c757d'
        }}>
          <p style={{ margin: '0 0 12px 0', lineHeight: '1.4' }}>
            You&apos;re receiving this because you subscribed to ThePressRadio newsletter.
          </p>
          <p style={{ margin: '0 0 15px 0' }}>
            <a href={unsubscribeUrl} style={{ color: '#6c757d', textDecoration: 'underline' }}>
              Unsubscribe
            </a>
            <span style={{ margin: '0 8px', color: '#adb5bd' }}>|</span>
            <a href="#" style={{ color: '#6c757d', textDecoration: 'underline' }}>
              Update Preferences
            </a>
            <span style={{ margin: '0 8px', color: '#adb5bd' }}>|</span>
            <a href="#" style={{ color: '#6c757d', textDecoration: 'underline' }}>
              View in Browser
            </a>
          </p>
          <p style={{ margin: '0', fontSize: '12px', color: '#adb5bd' }}>
            © 2024 ThePressRadio. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}