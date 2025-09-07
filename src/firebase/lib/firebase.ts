// ../lib/firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

// アプリケーション全体で一度だけFirebaseアプリを初期化する
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// getAuthとgetFirestoreを、確実に初期化されたappインスタンスに紐付ける
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// アプリインスタンスもエクスポート
export { app };
