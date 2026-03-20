import VideoUpload from '@/components/short-videos/VideoUpload'

export const metadata = {
  title: 'Upload Short Video - ThePressRadio',
  description: 'Share your story with the ThePressRadio community by uploading a short video.',
}

export default function UploadVideoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Upload Short Video
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Share your story, insights, or news with the ThePressRadio community.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <VideoUpload />
      </div>
    </div>
  )
}