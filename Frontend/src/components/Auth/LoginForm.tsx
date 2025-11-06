import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotify } from '../../hooks/useNotify';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  
  const { login } = useAuth();
  const notify = useNotify();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
        notify.error('Please fill in all fields.');
        return;
    }

    if (!emailRegex.test(formData.email)) {
        notify.error('Please enter a valid email address.');
        return;
    }

    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      if (!success) {
        notify.error('Invalid email or password');
      } else {
        notify.success('Logged in successfully!');
        window.location.href = "/dashboard";

      }
    } catch (err) {
      notify.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDemoLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogIn className="mr-2" size={20} />
            )}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => handleDemoLogin('admin@finance.com', 'admin123')}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-100"
          >
            Admin: admin@finance.com / admin123
          </button>
          <button
            onClick={() => handleDemoLogin('user@finance.com', 'user123')}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-100"
          >
            User: user@finance.com / user123
          </button>
          <button
            onClick={() => handleDemoLogin('auditor@finance.com', 'auditor123')}
            className="w-full border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-100"
          >
            Auditor: auditor@finance.com / auditor123
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={onToggleForm}
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
