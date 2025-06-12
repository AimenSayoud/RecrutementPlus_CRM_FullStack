// app/layout.tsx

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { TranslationProvider } from '@/hooks/useTranslation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RecruitmentPlus - Your Career Journey Starts Here',
  description: 'Connect talent with opportunity. RecruitmentPlus is the modern recruitment platform for candidates, employers, and consultants.',
  keywords: 'recruitment, jobs, careers, hiring, talent, employment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  )
}

