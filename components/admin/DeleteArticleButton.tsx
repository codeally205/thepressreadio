'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'
import { TrashIcon } from '@heroicons/react/24/outline'

interface DeleteArticleButtonProps {
  articleId: string
  articleTitle: string
}

export default function DeleteArticleButton({ articleId, articleTitle }: DeleteArticleButtonProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete article')
      }

      success('Article deleted successfully')
      router.refresh()
      setShowConfirm(false)
    } catch (err) {
      console.error('Error deleting article:', err)
      error('Failed to delete article. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Delete Article
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete &quot;{articleTitle}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <LoadingButton
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              variant="secondary"
              size="sm"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              onClick={handleDelete}
              loading={isDeleting}
              loadingText="Deleting..."
              variant="danger"
              size="sm"
            >
              Delete
            </LoadingButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-900 p-1"
      title="Delete Article"
    >
      <TrashIcon className="w-4 h-4" />
    </button>
  )
}