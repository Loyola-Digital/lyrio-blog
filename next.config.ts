import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security-headers'

// Modelo clássico de cache (ISR + revalidatePath), sem cacheComponents.
const nextConfig: NextConfig = {
  async headers() {
    return securityHeaders()
  },
}

export default nextConfig
