import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { UserList } from './components/Dashboard/UserList';
import { Navbar } from './components/Layout/Navbar';
import { ProtectedRoute } from './components/Layout/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { FaceVerification } from './components/FaceDetection/FaceDetection';
import { KYCAgent } from './components/KYCAgent/KYCAgent';
import { SmartKYCFlow } from './components/KYCAgent/SmartKYCFlow';
import ErrorBoundary from './components/Layout/ErrorBoundary';
import { KYCProvider } from './contexts/KYCContext';
import { ManualKYC } from './components/KYC/ManualKYC'; // NEW: Manual KYC flow

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      {isLogin ? (
        <LoginForm onToggleForm={() => setIsLogin(false)} />
      ) : (
        <SignupForm onToggleForm={() => setIsLogin(true)} />
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className={isAuthenticated ? 'pt-16' : ''}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* REMOVED: /kyc-agent route to avoid confusion */}
          <Route
            path="/face-verification"
            element={
              <ProtectedRoute>
                <FaceVerification />
              </ProtectedRoute>
            }
          />
          {/* NEW: Manual KYC Form Route */}
          <Route
            path="/manual-kyc"
            element={
              <ProtectedRoute>
                <ManualKYC />
              </ProtectedRoute>
            }
          />
          {/* NEW: AI Assistant Route */}
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <KYCAgent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <UserList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit/*"
            element={
              <ProtectedRoute requiredRole="auditor">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" reverseOrder={false} />
      <KYCProvider>
        <AppContent />
      </KYCProvider>
    </ErrorBoundary>
  );
}

export default App;