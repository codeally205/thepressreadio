import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function AuthDebugPage() {
  const session = await auth()
  const headersList = headers()
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Session Information</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
          <div className="text-sm space-y-1">
            <div>NODE_ENV: {process.env.NODE_ENV}</div>
            <div>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'Not set'}</div>
            <div>AUTH_URL: {process.env.AUTH_URL || 'Not set'}</div>
            <div>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set'}</div>
            <div>AUTH_SECRET: {process.env.AUTH_SECRET ? 'Set' : 'Not set'}</div>
            <div>GOOGLE_CLIENT_ID: {process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}</div>
            <div>GOOGLE_CLIENT_SECRET: {process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set'}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Request Headers</h2>
          <div className="text-sm space-y-1">
            <div>Host: {headersList.get('host')}</div>
            <div>User-Agent: {headersList.get('user-agent')?.substring(0, 100)}...</div>
            <div>Cookie: {headersList.get('cookie') ? 'Present' : 'Not present'}</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 border border-yellow-200">
          <h2 className="text-lg font-semibold mb-3">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Clear all browser cookies for localhost:3000</li>
            <li>Restart your development server</li>
            <li>Try signing in again</li>
            <li>If issues persist, check Google OAuth configuration</li>
          </ol>
        </div>

        <div className="bg-blue-50 p-4 border border-blue-200">
          <h2 className="text-lg font-semibold mb-3">Clear Cookies Script</h2>
          <p className="text-sm mb-2">Run this in your browser console to clear auth cookies:</p>
          <code className="text-xs bg-white p-2 block border">
            {`document.cookie.split(";").forEach(c => {
  const eqPos = c.indexOf("=");
  const name = eqPos > -1 ? c.substr(0, eqPos) : c;
  if (name.trim().includes('next-auth')) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
});
location.reload();`}
          </code>
        </div>
      </div>
    </div>
  )
}