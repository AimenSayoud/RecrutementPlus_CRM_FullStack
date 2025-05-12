// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';
import { OfficeProvider } from '@/app/context/OfficeContext';
import MainLayout from '@/components/layout/MainLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RecrutementPlus CRM',
  description: 'Recruitment CRM platform for managing candidates and companies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <OfficeProvider>
              <MainLayout>{children}</MainLayout>
            </OfficeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}