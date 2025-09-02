'use client';

import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

type AuthState = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    console.log('Setting up auth listener...');
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      console.log('Auth state changed in provider:', firebaseUser?.email || 'No user');
      try {
        if (firebaseUser) {
          const ref = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            console.log('User document exists');
            setAuthState({ user: firebaseUser, isLoading: false });
          } else {
            console.log('Creating user document');
            await setDoc(ref, {
              email: firebaseUser.email,
              createdAt: new Date().toISOString(),
            });
            setAuthState({ user: firebaseUser, isLoading: false });
          }
        } else {
          console.log('No user signed in');
          setAuthState({ user: null, isLoading: false });
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState({ user: null, isLoading: false });
      }
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
