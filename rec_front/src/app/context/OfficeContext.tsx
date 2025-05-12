// src/app/context/OfficeContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface OfficeContextType {
  selectedOffice: string;
  availableOffices: string[];
  setSelectedOffice: (office: string) => void;
}

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export const OfficeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const availableOffices = ['Montreal', 'Dubai', 'Istanbul'];
  const [selectedOffice, setSelectedOffice] = useState<string>(availableOffices[0]);

  // Set initial office based on user's assigned office if not a superadmin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      // Map officeId to office name
      const officeMap: Record<string, string> = {
        '1': 'Montreal',
        '2': 'Dubai',
        '3': 'Istanbul'
      };
      
      // If user has an officeId and it maps to a valid office
      if (user.officeId && officeMap[user.officeId]) {
        setSelectedOffice(officeMap[user.officeId]);
      }
    }
  }, [user]);

  return (
    <OfficeContext.Provider value={{ selectedOffice, availableOffices, setSelectedOffice }}>
      {children}
    </OfficeContext.Provider>
  );
};

export const useOffice = (): OfficeContextType => {
  const context = useContext(OfficeContext);
  if (context === undefined) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
};