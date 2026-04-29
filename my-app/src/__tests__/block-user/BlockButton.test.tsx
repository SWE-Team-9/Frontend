import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlockButton from '@/src/components/block-user/BlockButton';

describe('BlockButton', () => {
  it('shows "Block" when not blocked', () => {
    render(<BlockButton isBlocked={false} onClick={jest.fn()} />);
    expect(screen.getByText('Block')).toBeInTheDocument();
  });

  it('shows "Unblock" when blocked', () => {
    render(<BlockButton isBlocked={true} onClick={jest.fn()} />);
    expect(screen.getByText('Unblock')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<BlockButton isBlocked={false} onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('has red text styling', () => {
    render(<BlockButton isBlocked={false} onClick={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveClass('text-red-500');
  });
});