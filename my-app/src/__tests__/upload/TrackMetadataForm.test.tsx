/* eslint-disable react/display-name */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrackMetadataForm from '@/src/components/upload/TrackMetadataForm';

const mockSetMetadata = jest.fn();
jest.mock('@/src/store/useuploadStore', () => ({
  useUploadStore: () => ({ setMetadata: mockSetMetadata }),
}));
jest.mock('@/src/components/upload/UploadButton', () => {
  const MockUploadButton = () => <div data-testid="upload-button" />;
  MockUploadButton.displayName = 'MockUploadButton';
  return { __esModule: true, default: MockUploadButton };
});
jest.mock('@/src/components/ui/DatePickerInput', () => {
  const MockDatePickerInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input data-testid="date-picker" type="date" value={value} onChange={(e) => onChange(e.target.value)} />
  );
  MockDatePickerInput.displayName = 'MockDatePickerInput';
  return { __esModule: true, default: MockDatePickerInput };
});
jest.mock('@/src/components/tracks/WaveformDisplay', () => {
  const MockWaveformDisplay = () => <div data-testid="waveform" />;
  MockWaveformDisplay.displayName = 'MockWaveformDisplay';
  return { WaveformDisplay: MockWaveformDisplay };
});

const fillValidForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Enter Track Title'), { target: { value: 'My Track' } });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pop' } });
  fireEvent.change(screen.getByPlaceholderText('Tags (comma separated)'), { target: { value: 'pop, music' } });
  fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByPlaceholderText('Describe your track'), { target: { value: 'A great track' } });
};

describe('TrackMetadataForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all form fields', () => {
    render(<TrackMetadataForm />);
    expect(screen.getByPlaceholderText('Enter Track Title')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tags (comma separated)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe your track')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Save Info')).toBeInTheDocument();
  });

  it('renders all genre options in the dropdown', () => {
    render(<TrackMetadataForm />);
    const select = screen.getByRole('combobox');
    expect(select).toContainElement(screen.getByRole('option', { name: 'None' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'pop' }));
    expect(select).toContainElement(screen.getByRole('option', { name: 'electronic' }));
  });

  it('shows all validation errors when submitting empty form', async () => {
    render(<TrackMetadataForm />);
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(screen.getByText('Track title is required.')).toBeInTheDocument();
      expect(screen.getByText('Genre is required.')).toBeInTheDocument();
      expect(screen.getByText('At least one tag is required.')).toBeInTheDocument();
      expect(screen.getByText('Release date is required.')).toBeInTheDocument();
      expect(screen.getByText('Description is required.')).toBeInTheDocument();
    });
  });

  it('does not call setMetadata when form is invalid', () => {
    render(<TrackMetadataForm />);
    fireEvent.click(screen.getByText('Save Info'));
    expect(mockSetMetadata).not.toHaveBeenCalled();
  });

  it('calls setMetadata with correct data on valid submission', async () => {
    render(<TrackMetadataForm />);
    fillValidForm();
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(mockSetMetadata).toHaveBeenCalledWith({
        title: 'My Track',
        genre: 'pop',
        tags: ['pop', 'music'],
        releaseDate: '2026-01-01',
        visibility: 'PRIVATE',
        description: 'A great track',
      });
    });
  });

  it('shows success message after valid save', async () => {
    render(<TrackMetadataForm />);
    fillValidForm();
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(screen.getByText('Track Info Saved Successfully!')).toBeInTheDocument();
    });
  });

  it('defaults visibility to PRIVATE', () => {
    render(<TrackMetadataForm />);
    const privateBtn = screen.getByText('Private').closest('button');
    expect(privateBtn).toHaveClass('bg-[#ff5500]');
  });

  it('switches visibility to PUBLIC when Public is clicked', () => {
    render(<TrackMetadataForm />);
    fireEvent.click(screen.getByText('Public'));
    expect(screen.getByText('Public').closest('button')).toHaveClass('bg-[#ff5500]');
    expect(screen.getByText('Private').closest('button')).not.toHaveClass('bg-[#ff5500]');
  });

  it('updates character counter as user types description', () => {
    render(<TrackMetadataForm />);
    fireEvent.change(screen.getByPlaceholderText('Describe your track'), {
      target: { value: 'Hello' },
    });
    expect(screen.getByText('5 / 5000')).toBeInTheDocument();
  });

  it('shows error when more than 10 tags are entered', async () => {
    render(<TrackMetadataForm />);
    fireEvent.change(screen.getByPlaceholderText('Tags (comma separated)'), {
      target: { value: 'a, b, c, d, e, f, g, h, i, j, k' },
    });
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(screen.getByText('Maximum 10 tags allowed.')).toBeInTheDocument();
    });
  });

  it('clears title error when user starts typing', async () => {
    render(<TrackMetadataForm />);
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(screen.getByText('Track title is required.')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Enter Track Title'), {
      target: { value: 'T' },
    });
    expect(screen.queryByText('Track title is required.')).not.toBeInTheDocument();
  });

  it('rejects "None" as a valid genre', async () => {
    render(<TrackMetadataForm />);
    fireEvent.change(screen.getByPlaceholderText('Enter Track Title'), { target: { value: 'Track' } });
    fireEvent.click(screen.getByText('Save Info'));
    await waitFor(() => {
      expect(screen.getByText('Genre is required.')).toBeInTheDocument();
    });
  });
});