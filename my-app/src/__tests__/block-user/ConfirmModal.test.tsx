import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '@/src/components/block-user/ConfirmModal';

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  displayName: 'Alice',
  isBlocked: false,
};

describe('ConfirmModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when open is false', () => {
    render(<ConfirmModal {...defaultProps} open={false} />);
    expect(screen.queryByText(/Alice/)).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Block Alice?')).toBeInTheDocument();
  });

  it('shows block heading when not blocked', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={false} />);
    expect(screen.getByText('Block Alice?')).toBeInTheDocument();
  });

  it('shows unblock heading when blocked', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={true} />);
    expect(screen.getByText('Unblock Alice?')).toBeInTheDocument();
  });

  it('shows blocking consequences when not blocked', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={false} />);
    expect(screen.getByText(/will no longer be able to/)).toBeInTheDocument();
  });

  it('does not show blocking consequences when unblocking', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={true} />);
    expect(screen.queryByText(/will no longer be able to/)).not.toBeInTheDocument();
  });

  it('confirm button says "Block Alice" when not blocked', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={false} />);
    expect(screen.getByRole('button', { name: 'Block Alice' })).toBeInTheDocument();
  });

  it('confirm button says "Unblock Alice" when blocked', () => {
    render(<ConfirmModal {...defaultProps} isBlocked={true} />);
    expect(screen.getByRole('button', { name: 'Unblock Alice' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Block Alice' }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });
});