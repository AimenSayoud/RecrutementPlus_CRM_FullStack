// app/providers.tsx - Client-side providers wrapper

'use client'

import { ReactNode } from 'react'
import { TranslationProvider } from '@/hooks/useTranslation'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TranslationProvider>
      {children}
    </TranslationProvider>
  )
}