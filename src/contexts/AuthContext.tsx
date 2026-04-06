import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Set persistence to local
    setPersistence(auth, browserLocalPersistence);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);
    const profileRef = doc(db, 'users', user.uid);
    const userPath = `users/${user.uid}`;
    
    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        
        const isAdminEmail = ['rentatree@proton.me'].includes(user.email?.toLowerCase() || '');
        if (isAdminEmail && data.role !== 'admin') {
          try {
            await updateDoc(profileRef, { role: 'admin' });
            console.log('Admin role synchronized for:', user.email);
          } catch (err) {
            console.error('Failed to synchronize admin role:', err);
          }
        } else if (!isAdminEmail && data.role === 'admin') {
          // Demote if they are no longer in the admin list
          try {
            await updateDoc(profileRef, { role: 'user' });
            console.log('User demoted from admin:', user.email);
          } catch (err) {
            console.error('Failed to demote user:', err);
          }
        }
      } else {
        console.warn('User profile document does not exist in Firestore. Auto-creating...');
        // Auto-create missing profile to "repair" the account
        const isAdmin = ['rentatree@proton.me'].includes(user.email?.toLowerCase() || '');
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: isAdmin ? 'admin' : 'user',
          balance: 0,
          totalInvested: 0,
          totalReturns: 0,
          referredBy: null,
          createdAt: new Date().toISOString()
        };
        
        try {
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
          console.log('Profile auto-created for:', user.email);
        } catch (err) {
          console.error('Failed to auto-create profile:', err);
          setProfile(null);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error('AuthContext profile listener error:', err);
      setLoading(false);
      setError(err.message || 'Failed to load user profile');
      try {
        handleFirestoreError(err, OperationType.GET, userPath);
      } catch (e) {
        // handleFirestoreError throws, but we already set loading to false
      }
    });

    return () => unsubscribe();
  }, [user]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
