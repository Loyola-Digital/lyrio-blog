import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security-headers'

// Modelo clássico de cache (ISR + revalidatePath), sem cacheComponents.
const nextConfig: NextConfig = {
  experimental: { globalNotFound: true }, // 404 próprio para URLs fora de qualquer rota (há dois root layouts)
  async headers() {
    return securityHeaders()
  },
}

export default nextConfig
