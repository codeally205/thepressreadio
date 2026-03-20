import AdminSettings from '@/components/admin/AdminSettings'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your platform configuration</p>
      </div>

      <AdminSettings />
    </div>
  )
}