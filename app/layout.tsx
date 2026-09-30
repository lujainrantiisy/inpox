import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  metadataBase: new URL("https://inpox-lz2n.vercel.app"),
  title: "ReplAI",
  description: "One inbox, replying with AI",
  openGraph: {
    title: "ReplAI",
    description: "One inbox, one smart agent.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}