import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InputField from '../components/InputField';

describe('InputField component', () => {
  // Test that the input field renders with the correct label and placeholder
  it('renders with label and placeholder', () => {
    render(<InputField label="Username" id="user" placeholder="Enter name" value="" onChange={() => {}} />);
    // The input should be associated with the label and have the correct placeholder
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  // Test that the onChange handler is called when the input value changes
  it('calls onChange when input changes', () => {
    const handleChange = vi.fn();
    render(<InputField label="Test" id="test" value="" onChange={handleChange} />);
    // Simulate user typing in the input field
    fireEvent.change(screen.getByLabelText('Test'), { target: { value: 'abc' } });
    // The onChange handler should be called
    expect(handleChange).toHaveBeenCalled();
  });

  // Test that the error message is displayed if provided
  it('shows error message if provided', () => {
    render(<InputField label="Email" id="email" value="" onChange={() => {}} error="Invalid email" />);
    // The error message should be visible in the document
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  // Test that the input is disabled when the disabled prop is true
  it('is disabled when disabled prop is true', () => {
    render(<InputField label="Disabled" id="disabled" value="" onChange={() => {}} disabled />);
    // The input should be disabled and not interactive
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });
});