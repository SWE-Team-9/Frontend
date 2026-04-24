import * as uploadService from '@/src/services/uploadService';

const mockPost = jest.fn();
const mockGet = jest.fn();
const mockPatch = jest.fn();

jest.mock('@/src/services/api', () => ({
  __esModule: true,
  default: {
    post: (...args: unknown[]) => mockPost(...args),
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}));

const mockMetadata = {
  title: 'Test Track',
  genre: 'pop',
  tags: ['pop'],
  releaseDate: '2026-01-01T00:00:00.000Z',
  visibility: 'PRIVATE' as const,
  description: 'A test track',
  coverArt: null,
};

describe('uploadService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('uploadTrack', () => {
    it('calls POST with FormData body including audio and optional cover art', async () => {
      mockPost.mockResolvedValue({ data: { trackId: 'trk_001', status: 'PROCESSING' } });
      const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
      const cover = new File(['image'], 'cover.png', { type: 'image/png' });
      const result = await uploadService.uploadTrack(file, { ...mockMetadata, coverArt: cover });
      expect(mockPost).toHaveBeenCalled();
      const [url, body] = mockPost.mock.calls[0];
      expect(typeof url).toBe('string');
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get('audioFile')).toBe(file);
      expect((body as FormData).get('coverArt')).toBe(cover);
      expect(result).toEqual({ trackId: 'trk_001', status: 'PROCESSING' });
    });

    it('omits coverArt from FormData when no cover is provided', async () => {
      mockPost.mockResolvedValue({ data: { trackId: 'trk_001', status: 'PROCESSING' } });
      const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
      await uploadService.uploadTrack(file, { ...mockMetadata, coverArt: null });

      const [, body] = mockPost.mock.calls[0];
      expect((body as FormData).get('coverArt')).toBeNull();
    });

    it('rejects when API call fails', async () => {
      mockPost.mockRejectedValue(new Error('Upload failed'));
      const file = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' });
      await expect(uploadService.uploadTrack(file, mockMetadata)).rejects.toThrow('Upload failed');
    });
  });

  describe('getTrackDetails', () => {
    it('calls GET with the correct trackId', async () => {
      mockGet.mockResolvedValue({ data: { status: 'FINISHED', trackId: 'trk_001' } });
      const result = await uploadService.getTrackDetails('trk_001');
      const [url] = mockGet.mock.calls[0];
      expect(url).toContain('trk_001');
      expect(result.status).toBe('FINISHED');
    });

    it('rejects when API call fails', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));
      await expect(uploadService.getTrackDetails('trk_001')).rejects.toThrow('Not found');
    });
  });

  describe('changeTrackVisibility', () => {
    it('calls the correct endpoint with visibility value', async () => {
      mockPatch.mockResolvedValue({ data: { success: true } });
      await uploadService.changeTrackVisibility('trk_001', 'PUBLIC');
      const [url, body] = mockPatch.mock.calls[0];
      expect(url).toContain('trk_001');
      expect(body).toMatchObject({ visibility: 'PUBLIC' });
    });

    it('rejects when API call fails', async () => {
      mockPatch.mockRejectedValue(new Error('Visibility update failed'));
      await expect(uploadService.changeTrackVisibility('trk_001', 'PUBLIC')).rejects.toThrow('Visibility update failed');
    });
  });
});