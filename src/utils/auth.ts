export const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get token from localStorage first
    const token = localStorage.getItem('authToken');
    if (token) {
      return token;
    }
    
    // If not in localStorage, try to get from Firebase Auth
    const currentUser = (window as any).firebase?.auth()?.currentUser;
    if (currentUser) {
      const firebaseToken = await currentUser.getIdToken();
      // Store it for future use
      localStorage.setItem('authToken', firebaseToken);
      return firebaseToken;
    }
    
    console.error('No authentication token found');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};