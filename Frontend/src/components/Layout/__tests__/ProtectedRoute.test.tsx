import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { User } from '../../../types/auth';
import '@testing-library/jest-dom';

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

// Mock the useAuth hook
const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockUseAuth = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading message when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
    });

    render(
        <MemoryRouter>
            <ProtectedRoute>
                <TestComponent />
            </ProtectedRoute>
        </MemoryRouter>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    render(
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/login" element={<LoginComponent />} />
                <Route path="/protected" element={
                    <ProtectedRoute>
                        <TestComponent />
                    </ProtectedRoute>
                } />
            </Routes>
        </MemoryRouter>
    );
    
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated and no role required', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(
        <MemoryRouter>
            <ProtectedRoute>
                <TestComponent />
            </ProtectedRoute>
        </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has required role', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(
        <MemoryRouter>
            <ProtectedRoute requiredRole="user">
                <TestComponent />
            </ProtectedRoute>
        </MemoryRouter>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route path="/dashboard" element={<div>Dashboard</div>} />
                <Route path="/protected" element={
                    <ProtectedRoute requiredRole="admin">
                        <TestComponent />
                    </ProtectedRoute>
                } />
            </Routes>
        </MemoryRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
