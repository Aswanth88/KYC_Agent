import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { User } from '../../../types/auth';
import '@testing-library/jest-dom';

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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard for authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText(/Good (morning|afternoon|evening), John!/)).toBeInTheDocument();
    expect(screen.getByText('Welcome to your user dashboard')).toBeInTheDocument();
  });

  it('displays user-specific stats for regular user', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Account Status')).toBeInTheDocument();
    expect(screen.getByText('KYC Status')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Last Login')).toBeInTheDocument();
  });

  it('displays admin-specific stats for admin user', () => {
    const adminUser = { ...mockUser, role: 'admin' as const };
    mockUseAuth.mockReturnValue({
      user: adminUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('Pending Reviews')).toBeInTheDocument();
    expect(screen.getByText('Fraud Alerts')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  it('displays auditor-specific stats for auditor user', () => {
    const auditorUser = { ...mockUser, role: 'auditor' as const };
    mockUseAuth.mockReturnValue({
      user: auditorUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<Dashboard />);
    
    expect(screen.getByText('Reviews Completed')).toBeInTheDocument();
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('Flagged Cases')).toBeInTheDocument();
    expect(screen.getByText('Reports Generated')).toBeInTheDocument();
  });
});
