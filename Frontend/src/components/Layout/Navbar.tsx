import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, User as UserIcon, Shield, Briefcase, Landmark, ScanFace, MessageSquare } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={16} className="mr-2" />;
      case 'auditor': return <Briefcase size={16} className="mr-2" />;
      default: return <UserIcon size={16} className="mr-2" />;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'auditor': return 'bg-purple-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-md fixed w-full top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center">
            <Landmark className="h-8 w-8 mr-2" />
            <span className="text-xl font-bold">SecureFinance</span>
          </Link>

          {user && (
            <div className="flex items-center space-x-4">
              <div className={`hidden md:flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRoleClass(user.role)}`}>
                {getRoleIcon(user.role)}
                <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
              </div>
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 focus:outline-none">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${getRoleClass(user.role)}`}>
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={16} className="mr-2" />
                      Dashboard
                    </Link>
                    <Link
                      to="/face-verification"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <ScanFace size={16} className="mr-2" />
                      Face Detection
                    </Link>
                    <Link
                      to="/ai-assistant"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MessageSquare size={16} className="mr-2" />
                      KYC Agent
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
