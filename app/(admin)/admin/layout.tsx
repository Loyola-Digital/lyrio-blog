import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = {
  title: 'Admin · Lyrio Artigos',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="adm">{children}</body>
    </html>
  )
}
