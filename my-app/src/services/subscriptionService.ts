import api from "./api";

/**
 * Data structures for Subscription and Offline tracks
 */
export interface SubscriptionDetails {
  userId: string;
  subscriptionType: "FREE" | "PRO" | "GO+";
  uploadLimit: number;
  uploadedTracks: number;
  remainingUploads: number;
  perks: {
    adFree: boolean;
    offlineListening: boolean;
  };
}

export interface OfflineTrack {
  trackId: string;
  title: string;
  artist: string;
  downloadUrl: string;
}

/**
 * This allows simulating a real upgrade during development
 */
let MOCK_SUBSCRIPTION: SubscriptionDetails = {
  userId: "usr_123",
  subscriptionType: "FREE", // Starts as FREE
  uploadLimit: 10, // Default for FREE tier
  uploadedTracks: 1,
  remainingUploads: 9, // Set to 0 to test the quota limit scenario
  perks: { 
    adFree: false, 
    offlineListening: false 
  },
};

/**
 * Helper to check if we should use mock data from environment variables
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/**
 * Get current user's subscription and upload quota
 * Essential for displaying user status and managing limits 
 */
export const getMySubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    // Simulate network delay for realistic testing 
    await new Promise((resolve) => setTimeout(resolve, 800));

    // --- TESTING LOGIC ---
    // Decrease remaining count if greater than 0
    if (MOCK_SUBSCRIPTION.remainingUploads > 0) {
      MOCK_SUBSCRIPTION.remainingUploads -= 1; // Decrease remaining 
      MOCK_SUBSCRIPTION.uploadedTracks += 1;   // Increase uploaded tracks 
    }

    console.log("Mock Updated - Remaining:", MOCK_SUBSCRIPTION.remainingUploads);
    return { ...MOCK_SUBSCRIPTION }; // Return updated mock object 
  }

  // Real API call to GET /api/v1/subscriptions/me
  const response = await api.get("/subscriptions/me");
  return response.data;
};

/**
 * Upgrade user to PRO or GO+ plan
 * Implements the logic to update status and perks 
 */
export const upgradeSubscription = async (type: "PRO" | "GO+") => {
  if (USE_MOCK) {
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Update the mock object so other components see the change 
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      uploadLimit: 100, // Default for PRO/GO+ tiers
  uploadedTracks: 10,
  remainingUploads: 90, // Set to 0 to test the quota limit scenario
      perks: { 
        adFree: true, 
        offlineListening: true 
      },
    };

    return { 
      message: "Success", 
      newType: type,
      status: "ACTIVE" 
    };
  }

  // Real API call using mocked payment method as required 
  const response = await api.post("/subscriptions/subscribe", {
    subscriptionType: type,
    paymentMethodId: "mock_123"
  });
  return response.data;
};

/**
 * Get secure download link for offline listening
 * Only accessible if subscription perks allow 
 */
export const getOfflineTrack = async (trackId: string): Promise<OfflineTrack> => {
  if (USE_MOCK) {
    return {
      trackId,
      title: "Mock Track Title",
      artist: "Mock Artist",
      downloadUrl: "https://example.com/mock-download.mp3"
    };
  }

  // Secure endpoint for premium users only 
  const response = await api.get(`/subscriptions/offline/${trackId}`);
  return response.data;
};

/**
 * Check if the user has remaining upload quota
 * Prevents exceeding limits as per Module 12 rules 
 */
export const canUserUpload = async (): Promise<boolean> => {
  const sub = await getMySubscription();
  // Returns true only if remaining quota is greater than 0 
  return sub.remainingUploads > 0;
};