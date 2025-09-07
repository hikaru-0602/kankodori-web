import { getRemoteConfig } from 'firebase/remote-config';
import { getApps, getApp } from 'firebase/app';

// Remote Config専用のインスタンスを取得
export function getRemoteConfigInstance() {
  const app = getApps().length > 0 ? getApp() : null;
  if (!app) {
    throw new Error('Firebase app is not initialized');
  }
  return getRemoteConfig(app);
}
