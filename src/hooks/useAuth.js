import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const token = await user.getIdToken();
        localStorage.setItem('firebase_token', token);
        
        // Fetch additional user data from your API
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const userData = await response.json();
          setUser({ ...user, ...userData });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUser(user);
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('firebase_token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  
  const signUp = async (email, password, fullName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      return userCredential;
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out successfully",
        description: "You have been logged out",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
  };
};