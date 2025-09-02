"use client";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "@firebase/firestore";
import { onAuthStateChanged, getAuth, User } from "firebase/auth";

type FirestoreUserData = Record<string, unknown> | null | undefined;

const UserDataContext = createContext<FirestoreUserData>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<FirestoreUserData>(undefined);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: User | null) => {
        if (!firebaseUser) {
          setUserData(undefined);
          return;
        }
        const ref = doc(db, `users/${firebaseUser.uid}`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          setUserData(null);
        }
      }
    );
    return unsubscribe;
  }, []);

  return (
    <UserDataContext.Provider value={userData}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => useContext(UserDataContext);
