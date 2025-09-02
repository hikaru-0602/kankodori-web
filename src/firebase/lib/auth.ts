import { GoogleAuthProvider, signInWithPopup, UserCredential, signOut } from 'firebase/auth';
import { auth } from './firebase'; //認証情報を取得
import { getAuth } from 'firebase/auth'; //Firebase Authを取得

// ログイン処理の実行状態を管理
let isLoginInProgress = false;

export const login = async (): Promise<UserCredential | null> => {
  //ログイン
  // 既にログイン処理が実行中の場合は重複実行を防ぐ
  if (isLoginInProgress) {
    console.warn('ログイン処理が既に実行中です');
    return null;
  }

  try {
    isLoginInProgress = true;
    const provider = new GoogleAuthProvider(); //Googleの認証情報を取得

    // ポップアップブロッカー対策として、プロバイダーの設定を追加
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider); //ポップアップで認証
    console.log('ログイン成功:', result.user);
    return result;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    // エラータイプ別の処理
    if (firebaseError.code === 'auth/cancelled-popup-request') {
      console.log('前のポップアップリクエストがキャンセルされました');
    } else if (firebaseError.code === 'auth/popup-closed-by-user') {
      console.log('ユーザーがポップアップを閉じました');
    } else if (firebaseError.code === 'auth/popup-blocked') {
      console.error('ポップアップがブロックされました。ブラウザの設定を確認してください');
      alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
    } else {
      console.error('ログインエラー:', error);
    }
    throw error;
  } finally {
    isLoginInProgress = false;
  }
};

export const logout = (): Promise<void> => {
  //ログアウト
  return signOut(auth); //ログアウト
};

export function getAuthEmail(): string | null {
  //認証情報を取得
  const auth = getAuth().currentUser?.email;
  if (!auth) return null;
  const atIndex = auth.indexOf('@');
  return auth.slice(1, atIndex);
}

export async function loginAndGetAuth() {
  // ログイン処理を呼び出す
  const result = await login();
  if (!result) return null;

  return auth;
}

export async function getCurrentUserToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) return null;

  try {
    const token = await user.getIdToken();
    console.log('Firebase ID Token:', token);
    return token;
  } catch (error) {
    console.error('トークンの取得に失敗しました:', error);
    return null;
  }
}
