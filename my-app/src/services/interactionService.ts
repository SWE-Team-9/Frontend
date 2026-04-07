// src/services/interactionService.ts
export interface EngagementUser {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  isFollowing: boolean;
}

export const getTrackEngagements = async (trackId: string, type: 'likes' | 'reposts'): Promise<EngagementUser[]> => {
  // Mocking delay for realism
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return different mocks based on type
  if (type === 'likes') {
    return [
      { id: 101, name: "Salma Saad", handle: "salma_dev", avatar: "", isFollowing: true },
      { id: 102, name: "Mazen Lofi", handle: "mazen_beats", avatar: "", isFollowing: false },
    ];
  }
  return [
    { id: 103, name: "Doja Cat", handle: "dojacat", avatar: "", isFollowing: true },
  ];
};