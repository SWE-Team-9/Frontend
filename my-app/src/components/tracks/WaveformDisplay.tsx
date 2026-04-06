interface WaveformDisplayProps {
  data?: number[] | null;
}

function generateMockData(count = 120): number[] {
  return Array.from({ length: count }, () =>
    Math.min(1, Math.max(0.08, 0.2 + Math.random() * 0.8))
  );
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ data }) => {
  // Fall back to generated mock data if no real audio data is passed in
  const mockData = data || generateMockData(120);

  return (
    // Dark container background to match professional audio player aesthetics
    <div className="w-full h-full flex items-center px-2 bg-[#0f0f0f] rounded-md">

      <div className="w-full h-[75%] flex items-end gap-px">
        {mockData.map((val, i) => (

          // flex-grow distributes bars evenly across the full width
          <div key={i} className="grow h-full flex items-end">

            <div
              className="bg-gray-300 rounded-t-[1px] transition-all"
              style={{
                height: `${val * 100}%`,
                width: '1px',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};