import type { Metadata } from 'next'
import { asset } from '@/lib/site'
import './admin.css'

export const metadata: Metadata = {
  title: 'Admin · Lyrio Artigos',
  robots: { index: false, follow: false },
  icons: { icon: asset('/icon.png') },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="adm">{children}</body>
    </html>
  )
}
