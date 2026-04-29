import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dropzone from '@/src/components/upload/Dropzone';

const mockAddFile = jest.fn();
jest.mock('@/src/store/useuploadStore', () => ({
  useUploadStore: () => ({ addFile: mockAddFile, files: [] }),
}));
jest.mock('react-icons/io', () => ({
  IoIosCloudUpload: () => <div data-testid="upload-icon" />,
}));

describe('Dropzone', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders upload instructions', () => {
    render(<Dropzone />);
    expect(screen.getByText(/drag and drop audio files/i)).toBeInTheDocument();
    expect(screen.getByText(/supported: wav, mp3/i)).toBeInTheDocument();
  });

  it('applies disabled styles when disabled prop is true', () => {
    const { container } = render(<Dropzone disabled />);
    expect(container.firstChild).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies clickable styles when not disabled', () => {
    const { container } = render(<Dropzone />);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('file input accepts only .wav and .mp3', () => {
    const { container } = render(<Dropzone />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', '.wav,.mp3');
  });

  it('calls addFile when a file is dropped', () => {
    const { container } = render(<Dropzone />);
    const dropzone = container.firstChild as HTMLElement;
    const file = new File(['audio'], 'test.mp3', { type: 'audio/mpeg' });

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], clearData: jest.fn() },
    });

    expect(mockAddFile).toHaveBeenCalledWith(file);
  });

  it('does not open file picker when disabled is clicked', () => {
    const { container } = render(<Dropzone disabled />);
    const dropzone = container.firstChild as HTMLElement;
    const clickSpy = jest.fn();
    const input = container.querySelector('input') as HTMLInputElement;
    input.addEventListener('click', clickSpy);

    fireEvent.click(dropzone);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('calls onFilesAdded callback when a file is selected', () => {
    const onFilesAdded = jest.fn();
    const { container } = render(<Dropzone onFilesAdded={onFilesAdded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdded).toHaveBeenCalledWith([file]);
    expect(mockAddFile).toHaveBeenCalledWith(file);
  });

  it('handles drag over and drag leave without errors', () => {
    const { container } = render(<Dropzone />);
    const dropzone = container.firstChild as HTMLElement;
    expect(() => {
      fireEvent.dragOver(dropzone);
      fireEvent.dragLeave(dropzone);
    }).not.toThrow();
  });
});