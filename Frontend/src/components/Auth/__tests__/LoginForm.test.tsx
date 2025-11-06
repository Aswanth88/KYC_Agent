import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import '@testing-library/jest-dom';

// Mock the useAuth hook
const mockLogin = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
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

describe('LoginForm', () => {
  const mockToggleForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(true);
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm onToggleForm={mockToggleForm} />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onToggleForm={mockToggleForm} />);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalledWith('Please fill in all fields.');
    });
  });

  it('shows error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/email address/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
        expect(mockNotify.error).toHaveBeenCalledWith('Please enter a valid email address.');
    });
  });

  it('calls login on valid submission', async () => {
    const user = userEvent.setup();
    render(<LoginForm onToggleForm={mockToggleForm} />);
    await user.type(screen.getByPlaceholderText(/email address/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNotify.success).toHaveBeenCalledWith('Logged in successfully!');
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm onToggleForm={mockToggleForm} />);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const toggleButton = passwordInput.nextElementSibling;
    expect(passwordInput).toHaveAttribute('type', 'password');
    if (toggleButton) await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    if (toggleButton) await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('calls onToggleForm when signup link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm onToggleForm={mockToggleForm} />);
    await user.click(screen.getByText(/sign up here/i));
    expect(mockToggleForm).toHaveBeenCalledTimes(1);
  });
});
