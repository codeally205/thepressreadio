import { unstable_cache } from 'next/cache'

export function createCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyParts: string[],
  revalidate: number
) {
  return unstable_cache(fn, keyParts, { revalidate })
}
