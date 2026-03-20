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

  return (
    <div className="prose prose-lg max-w-none">
      <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
        {displayContent}
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
