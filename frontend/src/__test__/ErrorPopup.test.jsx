import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ErrorPopup from '../components/ErrorPopup';

describe('ErrorPopup component', () => {
  // Test that the popup renders and displays the error message when show is true
  it('renders when show is true', () => {
    render(<ErrorPopup show={true} message="Error occurred" onClose={() => {}} />);
    // The error message should be visible in the document
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  // Test that the popup does not render when show is false
  it('does not render when show is false', () => {
    render(<ErrorPopup show={false} message="Should not show" onClose={() => {}} />);
    // The error message should not be present in the document
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  // Test that the onClose handler is called when the close button is clicked
  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ErrorPopup show={true} message="Close me" onClose={handleClose} />);
    // Find the close button and simulate a click
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    // The onClose handler should be called once
    expect(handleClose).toHaveBeenCalled();
  });
});