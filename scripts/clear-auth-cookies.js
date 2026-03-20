// Simple script to help clear authentication cookies
// Run this in your browser's console if you're still having auth issues

console.log('Clearing NextAuth cookies...');

// List of NextAuth cookie names to clear
const cookiesToClear = [
  'next-auth.session-token',
  'next-auth.callback-url',
  'next-auth.csrf-token',
  'next-auth.pkce.code_verifier',
  'next-auth.state',
  'next-auth.nonce',
  '__Secure-next-auth.session-token',
  '__Secure-next-auth.callback-url',
  '__Host-next-auth.csrf-token',
  '__Secure-next-auth.pkce.code_verifier',
  '__Secure-next-auth.state',
  '__Secure-next-auth.nonce'
];

// Clear each cookie
cookiesToClear.forEach(cookieName => {
  // Clear for current domain
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  console.log(`Cleared cookie: ${cookieName}`);
});

console.log('All NextAuth cookies cleared. Please refresh the page and try signing in again.');
console.log('If the issue persists, restart your development server.');