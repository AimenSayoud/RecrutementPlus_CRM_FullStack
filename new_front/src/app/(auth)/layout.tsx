// app/(auth)/layout.tsx

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - RecruitmentPlus',
  description: 'Login or create an account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">R+</span>
          </div>
        </div>
        <h1 className="text-center text-3xl font-bold tracking-tight">
          RecruitmentPlus
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your Career Journey Starts Here
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2024 RecruitmentPlus. All rights reserved.</p>
      </footer>
    </div>
  )
}