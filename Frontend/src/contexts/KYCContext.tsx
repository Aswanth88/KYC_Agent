// contexts/KYCContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KYCApplication } from '../types/kyc';
import { getMyKYCApplications } from '../services/kycApi';

interface KYCContextType {
  applications: KYCApplication[];
  loading: boolean;
  refreshApplications: () => Promise<void>;
  getUserApplication: (userId: string) => KYCApplication | undefined;
}

const KYCContext = createContext<KYCContextType | undefined>(undefined);

export const useKYC = () => {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error('useKYC must be used within a KYCProvider');
  }
  return context;
};

interface KYCProviderProps {
  children: ReactNode;
}

export const KYCProvider: React.FC<KYCProviderProps> = ({ children }) => {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshApplications = async () => {
    try {
      setLoading(true);
      const result = await getMyKYCApplications();
      if (result.success && result.data) {
        setApplications(result.data);
      }
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserApplication = (userId: string): KYCApplication | undefined => {
    return applications.find(app => app.userId === userId);
  };

  useEffect(() => {
    refreshApplications();
  }, []);

  return (
    <KYCContext.Provider value={{
      applications,
      loading,
      refreshApplications,
      getUserApplication
    }}>
      {children}
    </KYCContext.Provider>
  );
};