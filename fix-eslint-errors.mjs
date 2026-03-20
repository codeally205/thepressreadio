#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

const files = [
  'app/(site)/about/page.tsx',
  'app/(site)/contact/page.tsx', 
  'app/(site)/unsubscribe/page.tsx',
  'app/not-found.tsx',
  'components/admin/DeleteArticleButton.tsx',
  'components/newsletter/NewsletterArchive.tsx',
  'components/newsletter/NewsletterSubscribe.tsx'
]

const fixes = [
  // Apostrophes
  { from: /([^&])'([^s])/g, to: '$1&apos;$2' },
  { from: /([^&])'s/g, to: '$1&apos;s' },
  { from: /don't/g, to: 'don&apos;t' },
  { from: /didn't/g, to: 'didn&apos;t' },
  { from: /we're/g, to: 'we&apos;re' },
  { from: /you're/g, to: 'you&apos;re' },
  { from: /it's/g, to: 'it&apos;s' },
  { from: /that's/g, to: 'that&apos;s' },
  { from: /what's/g, to: 'what&apos;s' },
  { from: /here's/g, to: 'here&apos;s' },
  { from: /there's/g, to: 'there&apos;s' },
  { from: /let's/g, to: 'let&apos;s' },
  { from: /can't/g, to: 'can&apos;t' },
  { from: /won't/g, to: 'won&apos;t' },
  { from: /shouldn't/g, to: 'shouldn&apos;t' },
  { from: /wouldn't/g, to: 'wouldn&apos;t' },
  { from: /couldn't/g, to: 'couldn&apos;t' },
  { from: /haven't/g, to: 'haven&apos;t' },
  { from: /hasn't/g, to: 'hasn&apos;t' },
  { from: /isn't/g, to: 'isn&apos;t' },
  { from: /aren't/g, to: 'aren&apos;t' },
  { from: /wasn't/g, to: 'wasn&apos;t' },
  { from: /weren't/g, to: 'weren&apos;t' },
  
  // Quotes (but not in JSX attributes)
  { from: /([^=])"([^>]*)"([^>])/g, to: '$1&quot;$2&quot;$3' },
]

console.log('🔧 Fixing ESLint errors...\n')

for (const filePath of files) {
  try {
    let content = readFileSync(filePath, 'utf8')
    let changed = false
    
    for (const fix of fixes) {
      const newContent = content.replace(fix.from, fix.to)
      if (newContent !== content) {
        content = newContent
        changed = true
      }
    }
    
    if (changed) {
      writeFileSync(filePath, content)
      console.log(`✅ Fixed: ${filePath}`)
    } else {
      console.log(`⏭️  No changes: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
  }
}

console.log('\n🎉 ESLint error fixing completed!')