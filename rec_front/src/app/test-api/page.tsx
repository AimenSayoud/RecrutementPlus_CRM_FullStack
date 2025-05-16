'use client';

import { useEffect, useState } from 'react';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function TestApiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const { companies, fetchCompanies, isLoading: companiesLoading } = useCompanyStore();
  const { login, user, isAuthenticated } = useAuthStore();

  const testLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login('superadmin@recruitmentplus.example', 'password');
      setTestResult({ message: 'Login successful', user });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchCompanies();
      setTestResult({ message: 'Companies fetched', count: companies.length });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Integration Test</h1>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Test</h2>
          <p className="mb-4">Current user: {user?.name || 'Not logged in'}</p>
          <p className="mb-4">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <Button onClick={testLogin} disabled={isLoading}>
            Test Login
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Companies Test</h2>
          <p className="mb-4">Companies loaded: {companies.length}</p>
          <Button onClick={testCompanies} disabled={isLoading || companiesLoading}>
            Test Fetch Companies
          </Button>
          {companies.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              <h3 className="font-semibold mb-2">Companies:</h3>
              <ul className="space-y-1">
                {companies.slice(0, 5).map((company) => (
                  <li key={company.id} className="text-sm">
                    {company.name} - {company.industry}
                  </li>
                ))}
              </ul>
              {companies.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... and {companies.length - 5} more
                </p>
              )}
            </div>
          )}
        </Card>

        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {testResult && (
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Result</h3>
            <pre className="text-green-600 whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}