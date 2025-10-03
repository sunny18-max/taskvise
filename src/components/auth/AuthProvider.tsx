import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  User,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  designation: string;
  department: string;
  skills: string[];
  role: string;
  location?: string;
  isActive: boolean;
  createdAt: any;
  lastLogin: any;
  passwordLastChanged: any;
  preferences?: {
    theme: string;
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    deadlineAlerts: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, employeeData: any) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Default user preferences
  const defaultPreferences = {
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    deadlineAlerts: true,
  };

  // Store additional user data in Firestore
  const storeUserDataInFirestore = async (uid: string, email: string, fullName: string, employeeData: any) => {
    try {
      const userData: UserProfile = {
        uid: uid,
        email: email,
        fullName: fullName,
        phone: employeeData.phone || '',
        designation: employeeData.designation || '',
        department: employeeData.department || '',
        skills: employeeData.skills || [],
        role: employeeData.role || 'employee',
        location: employeeData.location || '',
        createdAt: serverTimestamp(),
        isActive: true,
        lastLogin: null,
        passwordLastChanged: serverTimestamp(),
        preferences: defaultPreferences,
      };

      // Store in employees collection
      await setDoc(doc(db, 'employees', uid), userData);
      
      // Store in users collection for role-based access
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: email,
        role: employeeData.role,
        fullName: fullName,
        createdAt: serverTimestamp(),
        isActive: true,
        preferences: defaultPreferences,
      });

      return userData;
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  };

  // Get user profile from Firestore
  const getUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      // Try to get from employees collection first
      const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
      if (employeeDoc.exists()) {
        const data = employeeDoc.data();
        return {
          uid: user.uid,
          email: data.email || user.email || '',
          fullName: data.fullName || user.displayName || '',
          phone: data.phone || '',
          designation: data.designation || '',
          department: data.department || '',
          skills: data.skills || [],
          role: data.role || 'employee',
          location: data.location || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          passwordLastChanged: data.passwordLastChanged,
          preferences: data.preferences || defaultPreferences,
        };
      }
      
      // Fallback to users collection
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: user.uid,
          email: data.email || user.email || '',
          fullName: data.fullName || user.displayName || '',
          phone: data.phone || '',
          designation: data.designation || '',
          department: data.department || '',
          skills: data.skills || [],
          role: data.role || 'employee',
          location: data.location || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          lastLogin: data.lastLogin,
          passwordLastChanged: data.passwordLastChanged,
          preferences: data.preferences || defaultPreferences,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Get authentication token
  const getAuthToken = async (): Promise<string | null> => {
    if (!user) {
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Redirect user based on role
  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'manager':
        navigate('/manager/dashboard', { replace: true });
        break;
      case 'employee':
        navigate('/employee/dashboard', { replace: true });
        break;
      default:
        navigate('/employee/dashboard', { replace: true });
    }
  };

  // Refresh profile data
  const refreshProfile = async (): Promise<void> => {
    if (user) {
      const userProfile = await getUserProfile(user);
      setProfile(userProfile);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      throw new Error(errorMessage);
    }
  };

  // Change password function - FIXED with proper reauthentication
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    try {
      // Re-authenticate user using EmailAuthProvider
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      // Update password change timestamp in Firestore
      await updateDoc(doc(db, 'employees', user.uid), {
        passwordLastChanged: serverTimestamp(),
      });

      // Also update in users collection
      await updateDoc(doc(db, 'users', user.uid), {
        passwordLastChanged: serverTimestamp(),
      });

      toast({
        title: "Password updated successfully",
        description: "Your password has been changed. You can now log in with your new password.",
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log in again before changing your password.';
      } else if (error.code === 'auth/user-mismatch') {
        errorMessage = 'Authentication error. Please try logging in again.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid current password';
      }

      throw new Error(errorMessage);
    }
  };

  // Update user preferences
  const updateUserPreferences = async (preferences: Partial<UserProfile['preferences']>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedPreferences = {
        ...profile?.preferences,
        ...preferences,
      };

      // Update in Firestore
      await updateDoc(doc(db, 'employees', user.uid), {
        preferences: updatedPreferences,
      });

      // Update in users collection
      await updateDoc(doc(db, 'users', user.uid), {
        preferences: updatedPreferences,
      });

      // Update local state
      setProfile(prev => prev ? { ...prev, preferences: updatedPreferences } : null);

      toast({
        title: "Preferences updated",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  };

  // Sign up function - REMOVED AUTO-REDIRECT
  const signUp = async (email: string, password: string, fullName: string, employeeData: any): Promise<UserCredential> => {
    try {
      setIsLoading(true);
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Store additional user data in Firestore
      const userProfile = await storeUserDataInFirestore(userCredential.user.uid, email, fullName, employeeData);
      setProfile(userProfile);
      setUserRole(employeeData.role);

      toast({
        title: "Account created successfully!",
        description: `Welcome ${fullName}!`,
        variant: "default",
      });

      // REMOVED: Auto-redirect after signup - user should login separately
      // redirectBasedOnRole(employeeData.role);

      return userCredential;
    } catch (error: any) {
      console.error('Error signing up:', error);
      
      let errorMessage = 'Failed to create account';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }

      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function - FIXED to store token before redirect
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user profile and role
      const userProfile = await getUserProfile(userCredential.user);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : 'employee';
      
      setProfile(userProfile);
      setUserRole(role);

      // Store the authentication token in localStorage
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('Token stored in localStorage:', token);

      // Update last login timestamp
      await setDoc(doc(db, 'employees', userCredential.user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });

      toast({
        title: "Welcome back!",
        description: `Signed in successfully as ${email}`,
        variant: "default",
      });

      // Redirect based on role - AFTER token is stored
      redirectBasedOnRole(role);

    } catch (error: any) {
      console.error('Error signing in:', error);
      
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out...'); // Debug log
      await signOut(auth);
      console.log('Firebase signOut successful'); // Debug log
      
      // Clear local state and localStorage
      setUser(null);
      setUserRole(null);
      setProfile(null);
      localStorage.removeItem('authToken');
      
      console.log('Local state and token cleared'); // Debug log
      
      // Navigate to auth page
      navigate('/auth', { replace: true });
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out",
        variant: "default",
      });
      
      console.log('Navigation completed'); // Debug log
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get user role from Firestore
  const getUserRole = async (user: User): Promise<string> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data().role || 'employee';
      }
      
      // Fallback: check employees collection
      const employeeDoc = await getDoc(doc(db, 'employees', user.uid));
      if (employeeDoc.exists()) {
        return employeeDoc.data().role || 'employee';
      }
      
      return 'employee'; // Default role
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'employee';
    }
  };

  // Auth state listener - FIXED to prevent premature redirects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const [role, profileData] = await Promise.all([
            getUserRole(user),
            getUserProfile(user)
          ]);
          
          setUserRole(role);
          setProfile(profileData);

          // Store token when user state changes
          const token = await user.getIdToken();
          localStorage.setItem('authToken', token);
          
          // Only auto-redirect if user is on auth page AND has a profile
          const currentPath = window.location.pathname;
          if ((currentPath === '/auth' || currentPath === '/') && profileData) {
            // Small delay to ensure token is stored
            setTimeout(() => {
              redirectBasedOnRole(role);
            }, 100);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserRole('employee');
          setProfile(null);
        }
      } else {
        setUserRole(null);
        setProfile(null);
        localStorage.removeItem('authToken');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userRole,
    profile,
    isLoading,
    signUp,
    signIn,
    logout,
    refreshProfile,
    resetPassword,
    changePassword,
    updateUserPreferences,
    getAuthToken, // Added getAuthToken method
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};