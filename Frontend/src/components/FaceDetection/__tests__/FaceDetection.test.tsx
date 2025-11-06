import React from 'react';
import { render, screen } from '@testing-library/react';
import { FaceDetection } from '../FaceDetection';
import '@testing-library/jest-dom';

// Mock the useNotify hook
jest.mock('../../../hooks/useNotify', () => ({
  useNotify: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

describe('FaceDetection component', () => {
  it('renders the component with initial options', () => {
    render(<FaceDetection />);

    // Check for the main heading
    expect(screen.getByText('Face Detection')).toBeInTheDocument();

    // Check for the buttons
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });
});
