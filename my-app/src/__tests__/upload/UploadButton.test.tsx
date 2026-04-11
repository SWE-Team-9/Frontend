/* eslint-disable react/display-name */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadButton from '@/src/components/upload/UploadButton';
import * as uploadService from '@/src/services/uploadService';

const mockSetFiles = jest.fn();
const mockRouter = { push: jest.fn() };
let mockFiles: File[] = [];

const mockMetadata = {
  title: 'Test Track',
  genre: 'pop',
  tags: ['pop'],
  releaseDate: '2026-01-01',
  visibility: 'PRIVATE' as const,
  description: 'Test description',
};

jest.mock('@/src/store/useuploadStore', () => ({
  useUploadStore: () => ({
    files: mockFiles,
    setFiles: mockSetFiles,
    metadata: mockMetadata,
  }),
}));
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));
jest.mock('@/src/components/ui/FileStatusBadge', () => {
  const MockFileStatusBadge = ({ status }: { status: string }) => (
    <span data-testid={`badge-${status}`}>{status}</span>
  );
  MockFileStatusBadge.displayName = 'MockFileStatusBadge';
  return { __esModule: true, default: MockFileStatusBadge };
});
jest.mock('@/src/services/uploadService', () => ({
  uploadTrack: jest.fn(),
  getTrackDetails: jest.fn(),
  changeTrackVisibility: jest.fn(),
}));

describe('UploadButton', () => {
  beforeEach(() => {
    mockFiles = [];
    jest.clearAllMocks();
  });

  it('renders the upload button', () => {
    render(<UploadButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('button is disabled when no files', () => {
    render(<UploadButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('button is enabled and shows file count when files exist', () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    render(<UploadButton />);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveTextContent('(1) files');
  });

  it('calls uploadTrack with correct args when upload is clicked', async () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    (uploadService.uploadTrack as jest.Mock).mockResolvedValue({ trackId: 'trk_001', status: 'PROCESSING' });
    (uploadService.changeTrackVisibility as jest.Mock).mockResolvedValue({});
    (uploadService.getTrackDetails as jest.Mock).mockResolvedValue({ status: 'FINISHED' });
    render(<UploadButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(uploadService.uploadTrack).toHaveBeenCalledWith(mockFiles[0], mockMetadata);
    });
  });

  it('sets visibility after upload starts processing', async () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    (uploadService.uploadTrack as jest.Mock).mockResolvedValue({ trackId: 'trk_001', status: 'PROCESSING' });
    (uploadService.changeTrackVisibility as jest.Mock).mockResolvedValue({});
    (uploadService.getTrackDetails as jest.Mock).mockResolvedValue({ status: 'FINISHED' });
    render(<UploadButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(uploadService.changeTrackVisibility).toHaveBeenCalledWith('trk_001', 'PRIVATE');
    });
  });

  it('shows ERROR badge when upload fails', async () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    (uploadService.uploadTrack as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<UploadButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByTestId('badge-ERROR')).toBeInTheDocument();
    });
  });

  it('shows the error message when upload fails', async () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    (uploadService.uploadTrack as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<UploadButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows UPLOADING badge before upload resolves', async () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    (uploadService.uploadTrack as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<UploadButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByTestId('badge-UPLOADING')).toBeInTheDocument();
    });
  });
});