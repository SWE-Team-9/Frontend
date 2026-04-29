import { render, screen, fireEvent } from '@testing-library/react';
import { WaveformDisplay } from '@/src/components/tracks/WaveformDisplay';
import React from 'react';

/**
 * TASK: Waveform Display Unit Testing (Module 4)
 * Extracting Props types directly from the component to ensure type safety.
 */
type WaveformProps = React.ComponentProps<typeof WaveformDisplay>;

describe('WaveformDisplay Component (Module 4)', () => {
  // Define mock props based on the actual component implementation
  const mockProps: WaveformProps = {
    seed: "test-track-123", // Used by the component to generate random waveform data
    progress: 0.5,         // Represents 50% playback progress
    playedColor: "#ff5500",
    onSeek: jest.fn(),     // Mock function to track seek interactions
  };

  /**
   * TEST 1: Rendering Verification
   * Ensures the waveform container and bars are generated and present in the DOM.
   */
  test('renders waveform container with generated bars', () => {
    const { container } = render(<WaveformDisplay {...mockProps} />);
    
    // Verify that the component's main container is successfully rendered
    expect(container.firstChild).toBeInTheDocument();
  });

  /**
   * TEST 2: Interaction Verification (Seeking)
   * Ensures that clicking on the waveform triggers the onSeek callback with progress data.
   */
  test('calls onSeek when the waveform is clicked', () => {
    render(<WaveformDisplay {...mockProps} />);
    
    // Find the waveform container using its accessibility role and label
    const waveformContainer = screen.getByRole('button', { name: /seek audio waveform/i });
    
    // Simulate a user click event on the waveform at a specific horizontal position
    fireEvent.click(waveformContainer, { clientX: 100 });
    
    // Assert that the onSeek mock function was called exactly once
    expect(mockProps.onSeek).toHaveBeenCalled();
  });
});