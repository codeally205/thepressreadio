'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'
import { PaperAirplaneIcon, EyeIcon, PhotoIcon, XMarkIcon, LinkIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import NewsletterTemplate from './NewsletterTemplate'
import { newsletterTemplates } from '@/lib/newsletter-templates'

interface Newsletter {
  id: string
  subject: string
  previewText: string | null
  content: any
  status: string
}

interface NewsletterEditorProps {
  newsletter?: Newsletter
}

export default function NewsletterEditor({ newsletter }: NewsletterEditorProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [formData, setFormData] = useState({
    subject: newsletter?.subject || '',
    previewText: newsletter?.previewText || '',
    content: newsletter?.content || { html: '' },
  })

  const handleTemplateSelect = (templateKey: string) => {
    const template = newsletterTemplates[templateKey as keyof typeof newsletterTemplates]
    if (template) {
      setFormData({
        subject: template.subject,
        previewText: template.previewText,
        content: { html: template.content }
      })
      setShowTemplateModal(false)
    }
  }

  const insertHtmlTag = (openTag: string, closeTag: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    let replacement
    if (selectedText) {
      replacement = `${openTag}${selectedText}${closeTag}`
    } else {
      replacement = `${openTag}${closeTag}`
    }

    const newContent = 
      textarea.value.substring(0, start) + 
      replacement + 
      textarea.value.substring(end)

    setFormData(prev => ({
      ...prev,
      content: { ...prev.content, html: newContent }
    }))

    // Set cursor position
    setTimeout(() => {
      const newPosition = selectedText ? start + replacement.length : start + openTag.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Please select an image file')
      return
    }

    // Validate file size (max 4MB for Vercel deployment)
    if (file.size > 4 * 1024 * 1024) {
      error('Image size must be less than 4MB for serverless deployment')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const result = await response.json()
      
      // Insert image HTML at cursor position in textarea
      const textarea = textareaRef.current
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageHtml = `<img src="${result.url}" alt="${result.originalName}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
        
        const newContent = 
          textarea.value.substring(0, start) + 
          imageHtml + 
          textarea.value.substring(end)

        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content,
            html: newContent
          }
        }))

        // Set cursor position after the inserted image
        setTimeout(() => {
          const newPosition = start + imageHtml.length
          textarea.setSelectionRange(newPosition, newPosition)
          textarea.focus()
        }, 0)
      } else {
        // Fallback: append to end if no textarea reference
        const imageHtml = `<img src="${result.url}" alt="${result.originalName}" style="max-width: 100%; height: auto; margin: 10px 0;" />`
        
        setFormData(prev => ({
          ...prev,
          content: {
            ...prev.content,
            html: (prev.content.html || '') + imageHtml
          }
        }))
      }

      success('Image uploaded successfully!')
    } catch (err) {
      console.error('Error uploading image:', err)
      error('Failed to upload image')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
    setIsLoading(true)
    try {
      const url = newsletter 
        ? `/api/admin/newsletters/${newsletter.id}`
        : '/api/admin/newsletters'
      
      const method = newsletter ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Server error:', errorData)
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      
      if (status === 'sent') {
        success('Newsletter sent successfully!')
      } else {
        success('Newsletter saved as draft!')
      }
      
      router.push('/admin/newsletters')
    } catch (err) {
      console.error('Error saving newsletter:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save newsletter'
      error(`Failed to save newsletter: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = () => {
    if (!newsletter) {
      // For new newsletters, open preview in new tab
      const templateHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Newsletter Preview</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
            ${renderTemplate()}
          </body>
        </html>
      `
      
      const previewWindow = window.open('', '_blank', 'width=700,height=900')
      if (previewWindow) {
        previewWindow.document.write(templateHtml)
        previewWindow.document.close()
      }
    } else {
      // For existing newsletters, navigate to preview page
      router.push(`/admin/newsletters/${newsletter.id}/preview`)
    }
  }

  const renderTemplate = () => {
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/logo.png`
    
    // Render the template as HTML string
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #ffffff; color: #000000; padding: 30px 20px; text-align: center; border-bottom: 3px solid #000000;">
          <img src="${logoUrl}" alt="ThePressRadio Logo" style="height: 80px; width: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
          <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 2px; color: #000000;">
            ThePressRadio
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; color: #666666; font-weight: 500;">
            Pan-African Digital News Platform
          </p>
        </div>

        <!-- Subject Line -->
        <div style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
          <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: bold; margin: 0 0 15px 0; line-height: 1.3; color: #000000;">
            ${formData.subject || 'Newsletter Subject'}
          </h2>
          ${formData.previewText ? `
            <p style="font-size: 18px; color: #555555; margin: 0; font-style: italic; line-height: 1.5;">
              ${formData.previewText}
            </p>
          ` : ''}
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; line-height: 1.8; font-size: 16px; color: #333333;">
          ${formData.content.html || 'No content yet'}
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 40px 30px; border-top: 3px solid #000000; text-align: center;">
          <div style="margin-bottom: 30px;">
            <img src="${logoUrl}" alt="ThePressRadio Logo" style="height: 50px; width: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
            <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: bold; margin: 0 0 15px 0; color: #000000;">
              Stay Connected
            </h3>
            <p style="font-size: 16px; color: #555555; margin: 0 0 25px 0; line-height: 1.5;">
              Follow us for the latest African news and insights
            </p>
            
            <div style="margin-bottom: 30px;">
              <a href="#" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500;">Website</a>
              <a href="#" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500;">Twitter</a>
              <a href="#" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500;">LinkedIn</a>
            </div>
          </div>

          <div style="border-top: 2px solid #dee2e6; padding-top: 25px; font-size: 13px; color: #6c757d;">
            <p style="margin: 0 0 12px 0; line-height: 1.4;">
              You're receiving this because you subscribed to ThePressRadio newsletter.
            </p>
            <p style="margin: 0 0 15px 0;">
              <a href="#" style="color: #6c757d; text-decoration: underline;">Unsubscribe</a>
              <span style="margin: 0 8px; color: #adb5bd;">|</span>
              <a href="#" style="color: #6c757d; text-decoration: underline;">Update Preferences</a>
              <span style="margin: 0 8px; color: #adb5bd;">|</span>
              <a href="#" style="color: #6c757d; text-decoration: underline;">View in Browser</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #adb5bd;">
              © 2024 ThePressRadio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {newsletter ? 'Edit Newsletter' : 'Create Newsletter'}
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Template Selection */}
        {!newsletter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">Start with a template</h4>
                <p className="text-sm text-blue-700">Choose a pre-designed template to get started quickly</p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Choose Template
              </button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter newsletter subject..."
          />
        </div>

        <div>
          <label htmlFor="previewText" className="block text-sm font-medium text-gray-700 mb-2">
            Preview Text
          </label>
          <input
            type="text"
            id="previewText"
            value={formData.previewText}
            onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="This appears in email previews..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <PhotoIcon className="w-4 h-4 mr-1" />
                {uploadingImage ? 'Uploading...' : 'Add Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
            <button
              type="button"
              onClick={() => insertHtmlTag('<strong>', '</strong>')}
              className="px-2 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<em>', '</em>')}
              className="px-2 py-1 text-xs italic text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<u>', '</u>')}
              className="px-2 py-1 text-xs underline text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Underline"
            >
              U
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => insertHtmlTag('<h2>', '</h2>')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Heading"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<h3>', '</h3>')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Subheading"
            >
              H3
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => insertHtmlTag('<a href="">', '</a>')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<ul><li>', '</li></ul>')}
              className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Bullet List"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<ol><li>', '</li></ol>')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Numbered List"
            >
              OL
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              type="button"
              onClick={() => insertHtmlTag('<p>', '</p>')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Paragraph"
            >
              P
            </button>
            <button
              type="button"
              onClick={() => insertHtmlTag('<br>')}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
              title="Line Break"
            >
              BR
            </button>
          </div>

          <textarea
            ref={textareaRef}
            id="content"
            rows={12}
            value={formData.content.html || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              content: { ...formData.content, html: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your newsletter content here..."
          />
          <p className="text-sm text-gray-500 mt-2">
            Use the toolbar above for formatting, or write HTML directly. Images will be automatically inserted when uploaded.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to send this newsletter? This action cannot be undone.')) {
                  handleSave('sent')
                }
              }}
              disabled={isLoading || !formData.subject || !formData.content.html}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Newsletter'}
            </button>
          </div>
        </div>

        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Choose Template</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(newsletterTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{template.previewText}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}