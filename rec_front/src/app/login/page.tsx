// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/app/context/ThemeContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user, isLoading, error: authError } = useAuthStore();
  const { colors } = useTheme();
  const router = useRouter();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className="max-w-md w-full p-8 rounded-lg shadow-lg"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>RecrutementPlus</h1>
          <p className="text-sm mt-2 opacity-75" style={{ color: colors.text }}>Log in to your CRM account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-1"
              style={{ color: colors.text }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
                outline: colors.primary 
              }}
              required
            />
            <p className="mt-1 text-xs opacity-75" style={{ color: colors.text }}>
              Use &quot;super_admin@example.com&quot; for Super Admin access
            </p>
          </div>
          
          <div className="mb-6">
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-1"
              style={{ color: colors.text }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
                outline: colors.primary 
              }}
              required
            />
            <p className="mt-1 text-xs opacity-75" style={{ color: colors.text }}>
              Use any password for this demo
            </p>
          </div>
          
          <button
            type="submit"
            className={`w-full py-2 rounded-md font-medium transition-colors hover:bg-blue-600 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            style={{ 
              backgroundColor: colors.primary,
              color: 'white',
              // Hover effect should be handled via Tailwind CSS or external CSS
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}