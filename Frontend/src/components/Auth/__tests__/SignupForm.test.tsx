import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../SignupForm';
import '@testing-library/jest-dom';

// Mock the useAuth hook
const mockSignup = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signup: mockSignup,
    loading: false,
  }),
}));

// Mock the useNotify hook
const mockNotify = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
};
jest.mock('../../../hooks/useNotify', () => ({
    useNotify: () => mockNotify,
}));

describe('SignupForm', () => {
  const mockToggleForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignup.mockResolvedValue(true);
  });

  it('renders signup form with all required fields', () => {
    render(<SignupForm onToggleForm={mockToggleForm} />);
    expect(screen.getByRole('heading', { name: /create account/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows error for empty fields', async () => {
    const user = userEvent.setup();
    render(<SignupForm onToggleForm={mockToggleForm} />);
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalledWith('Please fill in all fields.');
    });
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<SignupForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/email address/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalledWith('Please enter a valid email address.');
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<SignupForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/first name/i), 'John');
    await user.type(screen.getByPlaceholderText(/last name/i), 'Doe');
    await user.type(screen.getByPlaceholderText(/email address/i), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'differentpassword');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('shows error when password is too short', async () => {
    const user = userEvent.setup();
    render(<SignupForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/first name/i), 'John');
    await user.type(screen.getByPlaceholderText(/last name/i), 'Doe');
    await user.type(screen.getByPlaceholderText(/email address/i), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Password'), '123');
    await user.type(screen.getByPlaceholderText(/confirm password/i), '123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(mockNotify.error).toHaveBeenCalledWith('Password must be at least 6 characters');
    });
  });

  it('calls signup on valid submission', async () => {
    const user = userEvent.setup();
    render(<SignupForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/first name/i), 'John');
    await user.type(screen.getByPlaceholderText(/last name/i), 'Doe');
    await user.type(screen.getByPlaceholderText(/email address/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
        });
        expect(mockNotify.success).toHaveBeenCalledWith('Account created successfully! Please sign in.');
    });
  });
});
