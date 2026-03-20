import ShortVideosManager from '@/components/admin/ShortVideosManager'

export const metadata = {
  title: 'Short Videos Management - Admin',
  description: 'Manage and moderate short videos uploaded by users.',
}

export default function AdminShortVideosPage() {
  return (
    <div className="p-4 sm:p-6 max-w-full overflow-hidden">
      <ShortVideosManager />
    </div>
  )
}