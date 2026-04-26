import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'NEON IMPOSTOR - Social Deduction in Space',
  description: 'A real-time multiplayer social deduction game with neon cyberpunk aesthetics. Play with friends, complete tasks, and find the impostor!',
  generator: 'v0.app',
  keywords: ['among us', 'social deduction', 'multiplayer', 'game', 'impostor', 'neon', 'cyberpunk'],
  authors: [{ name: 'NEON IMPOSTOR Team' }],
  openGraph: {
    title: 'NEON IMPOSTOR - Social Deduction in Space',
    description: 'A real-time multiplayer social deduction game with neon cyberpunk aesthetics.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEON IMPOSTOR - Social Deduction in Space',
    description: 'A real-time multiplayer social deduction game with neon cyberpunk aesthetics.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000011',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-[#000011]">
      <body className="font-sans antialiased min-h-screen bg-[#000011] text-white overflow-x-hidden">
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            className: 'bg-gray-900/95 border border-cyan-500/30 text-white',
            duration: 4000,
          }}
          closeButton
        />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
