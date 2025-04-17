import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../components/Button';

describe('Button component', () => {
  // Test that the button renders with the correct text content
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    // The button should display the provided children text
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  // Test that the onClick handler is called when the button is clicked
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    // Simulate a click event on the button
    fireEvent.click(screen.getByText('Click'));
    // The handler should be called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test that the button is disabled when the disabled prop is true
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    // The button should be disabled and not interactive
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  // Test that a custom className is applied to the button
  it('applies custom className', () => {
    render(<Button className="test-class">Test</Button>);
    // The button should have the custom class in its className
    expect(screen.getByText('Test').className).toContain('test-class');
  });
});