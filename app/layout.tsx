import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: {
    default: 'ShulPad - Merchant Dashboard',
    template: '%s | ShulPad'
  },
  description: 'ShulPad merchant dashboard for managing your business, tracking metrics, and monitoring performance in real-time.',
  keywords: ['ShulPad', 'merchant dashboard', 'business management', 'analytics', 'metrics'],
  authors: [{ name: 'ShulPad' }],
  creator: 'ShulPad',
  publisher: 'ShulPad',
  metadataBase: new URL('https://shulpad.com'), // Update with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ShulPad - Merchant Dashboard',
    description: 'ShulPad merchant dashboard for managing your business, tracking metrics, and monitoring performance in real-time.',
    url: 'https://shulpad.com', // Update with your actual domain
    siteName: 'ShulPad',
    images: [
      {
        url: '/shulpad-logo.png',
        width: 1200,
        height: 630,
        alt: 'ShulPad Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShulPad - Merchant Dashboard',
    description: 'ShulPad merchant dashboard for managing your business, tracking metrics, and monitoring performance in real-time.',
    images: ['/shulpad-logo.png'],
    creator: '@shulpad', // Update with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
