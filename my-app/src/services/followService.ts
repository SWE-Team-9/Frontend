// This simulates the backend API behavior
export const followUser = async (userId: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`API: Followed user ${userId}`);
      resolve();
    }, 1000); // 1 second delay
  });
};

export const unfollowUser = async (userId: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`API: Unfollowed user ${userId}`);
      resolve();
    }, 1000);
  });
};