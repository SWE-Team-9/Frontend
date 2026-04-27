 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadForm from '@/src/components/upload/UploadForm';

const mockRemoveFile = jest.fn();
let mockFiles: File[] = [];

jest.mock('@/src/store/useuploadStore', () => ({
  useUploadStore: () => ({ files: mockFiles, removeFile: mockRemoveFile }),
}));
jest.mock('@/src/components/upload/Dropzone', () => {
  const MockDropzone = ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="dropzone" data-disabled={String(!!disabled)} />
  );
  MockDropzone.displayName = 'MockDropzone';
  return { __esModule: true, default: MockDropzone };
});
jest.mock('react-icons/md', () => ({
  MdDeleteForever: () => <span>Delete</span>,
}));

// ── Subscription store mock ───────────────────────────────────────────────────
const mockFetchSubscription = jest.fn();
let mockSubState: { sub: null | object; isLoading: boolean } = { sub: null, isLoading: false };

jest.mock('@/src/store/useSubscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector: (s: object) => unknown) =>
    selector({
      sub: mockSubState.sub,
      isLoading: mockSubState.isLoading,
      fetchSubscription: mockFetchSubscription,
    }),
  ),
}));

describe('UploadForm', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    mockFiles = [];
    mockSubState = { sub: null, isLoading: false };
    jest.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText('Upload your audio files')).toBeInTheDocument();
  });

  it('renders the Dropzone', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('renders Dropzone as enabled when no files', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByTestId('dropzone').getAttribute('data-disabled')).toBe('false');
  });

  it('renders Dropzone as disabled when a file exists', () => {
    mockFiles = [new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })];
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByTestId('dropzone').getAttribute('data-disabled')).toBe('true');
  });

  it('does not show file list when no files', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows file name when a file is present', () => {
    mockFiles = [new File(['audio'], 'mytrack.mp3', { type: 'audio/mpeg' })];
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText('mytrack.mp3')).toBeInTheDocument();
  });

  it('calls removeFile with correct index on delete click', () => {
    mockFiles = [new File(['audio'], 'mytrack.mp3', { type: 'audio/mpeg' })];
    render(<UploadForm onNext={mockOnNext} />);
    fireEvent.click(screen.getByText('Delete').closest('button')!);
    expect(mockRemoveFile).toHaveBeenCalledWith(0);
  });

  it('does not show Next button when no files', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows Next button when files are present', () => {
    mockFiles = [new File(['audio'], 'mytrack.mp3', { type: 'audio/mpeg' })];
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('calls onNext when Next button is clicked', () => {
    mockFiles = [new File(['audio'], 'mytrack.mp3', { type: 'audio/mpeg' })];
    render(<UploadForm onNext={mockOnNext} />);
    fireEvent.click(screen.getByText('Next'));
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('calls fetchSubscription on mount', () => {
    render(<UploadForm onNext={mockOnNext} />);
    expect(mockFetchSubscription).toHaveBeenCalledTimes(1);
  });

  it('shows "Checking quota..." while subscription is loading', () => {
    mockSubState = { sub: null, isLoading: true };
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText('Checking quota...')).toBeInTheDocument();
  });

  it('shows quota display when subscription is loaded', () => {
    mockSubState = {
      isLoading: false,
      sub: { subscriptionType: 'FREE', uploadLimit: 3, uploadedTracks: 1, remainingUploads: 2, perks: { adFree: false, offlineListening: false } },
    };
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText('2 / 3 remaining')).toBeInTheDocument();
  });

  it('shows paywall block when quota is exhausted (remainingUploads=0)', () => {
    mockSubState = {
      isLoading: false,
      sub: { subscriptionType: 'FREE', uploadLimit: 3, uploadedTracks: 3, remainingUploads: 0, perks: { adFree: false, offlineListening: false } },
    };
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByText(/reached your upload limit/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toBeInTheDocument();
    expect(screen.queryByTestId('dropzone')).not.toBeInTheDocument();
  });

  it('shows normal upload UI when quota is not exhausted', () => {
    mockSubState = {
      isLoading: false,
      sub: { subscriptionType: 'PRO', uploadLimit: 100, uploadedTracks: 5, remainingUploads: 95, perks: { adFree: true, offlineListening: true } },
    };
    render(<UploadForm onNext={mockOnNext} />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.queryByText(/reached your upload limit/i)).not.toBeInTheDocument();
  });
});