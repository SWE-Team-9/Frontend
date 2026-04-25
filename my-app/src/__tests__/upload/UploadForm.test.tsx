 
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

describe('UploadForm', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    mockFiles = [];
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
});