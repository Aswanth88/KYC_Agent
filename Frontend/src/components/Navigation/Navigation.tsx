import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Home, FileText, Shield, BarChart3, Users } from 'lucide-react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView }) => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'kyc-form', label: 'KYC Application', icon: FileText },
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { id: 'admin', label: 'Applications', icon: Users },
        { id: 'audit', label: 'Audit Reports', icon: BarChart3 },
      ];
    }

    if (user.role === 'auditor') {
      return [
        ...baseItems,
        { id: 'audit', label: 'Audit Dashboard', icon: BarChart3 },
      ];
    }

    return baseItems;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {getNavigationItems().map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};