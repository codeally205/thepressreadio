'use client'

interface ArticleBodyProps {
  body: any
  truncate?: boolean
  truncateLength?: number
}

export default function ArticleBody({ 
  body, 
  truncate = false, 
  truncateLength = 800 
}: ArticleBodyProps) {
  // Handle different body formats
  let content = ''
  
  if (typeof body === 'string') {
    content = body
  } else if (body && typeof body === 'object') {
    // If it's a Lexical/Payload rich text object, try to extract text content
    if (body.type === 'doc' && body.content) {
      // Simple extraction of text from Lexical format
      content = extractTextFromLexical(body.content)
    } else {
      // Fallback to JSON string for debugging
      content = JSON.stringify(body, null, 2)
    }
  }
  
  // Smart truncation that tries to end at sentence boundaries
  const getDisplayContent = () => {
    if (!truncate) return content
    
    if (content.length <= truncateLength) return content
    
    // Try to find a good breaking point (sentence end)
    const truncated = content.slice(0, truncateLength)
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    )
    
    if (lastSentenceEnd > truncateLength * 0.7) {
      // If we found a sentence end that's not too early, use it
      return truncated.slice(0, lastSentenceEnd + 1)
    } else {
      // Otherwise, find the last complete word
      const lastSpace = truncated.lastIndexOf(' ')
      return lastSpace > 0 ? truncated.slice(0, lastSpace) + '...' : truncated + '...'
    }
  }

  const displayContent = getDisplayContent()

  // Automatically split content into paragraphs
  const createParagraphs = (text: string): string[] => {
    // First, try to split by existing line breaks
    if (text.includes('\n\n')) {
      return text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0)
    }
    
    if (text.includes('\n')) {
      return text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 0)
    }
    
    // If no line breaks, split by sentences (every 4-6 sentences = 1 paragraph)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const paragraphs: string[] = []
    let currentParagraph = ''
    let sentenceCount = 0
    
    sentences.forEach((sentence) => {
      currentParagraph += sentence
      sentenceCount++
      
      // Create a new paragraph every 4-6 sentences
      if (sentenceCount >= 4 && (sentenceCount >= 6 || Math.random() > 0.5)) {
        paragraphs.push(currentParagraph.trim())
        currentParagraph = ''
        sentenceCount = 0
      }
    })
    
    // Add any remaining text as the last paragraph
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim())
    }
    
    return paragraphs.filter(p => p.length > 0)
  }

  const paragraphs = createParagraphs(displayContent)

  return (
    <div className="prose prose-lg max-w-none">
      <div className="space-y-6 leading-relaxed text-gray-800">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-lg leading-relaxed text-justify">
            {paragraph}
          </p>
        ))}
      </div>
      {truncate && content.length > truncateLength && (
        <div className="mt-4 text-sm text-gray-500 italic">
          Article continues below...
        </div>
      )}
    </div>
  )
}

// Helper function to extract text from Lexical format
function extractTextFromLexical(content: any[]): string {
  if (!Array.isArray(content)) return ''
  
  return content.map(node => {
    if (node.type === 'paragraph' && node.children) {
      return node.children.map((child: any) => {
        if (child.type === 'text') {
          return child.text || ''
        }
        return ''
      }).join('')
    }
    if (node.type === 'heading' && node.children) {
      const headingText = node.children.map((child: any) => child.text || '').join('')
      return `\n\n${headingText}\n\n`
    }
    if (node.type === 'text') {
      return node.text || ''
    }
    return ''
  }).join('\n\n')
}
