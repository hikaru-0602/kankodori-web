import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { app } from '@/firebase/lib/firebase';

let remoteConfig: ReturnType<typeof getRemoteConfig> | null = null;
let isInitialized = false;

// デフォルト値を設定
const defaultValues = {
  api_server_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3110',
};

/**
 * Remote Configを初期化
 */
export async function initializeRemoteConfig() {
  if (isInitialized) return;

  try {
    remoteConfig = getRemoteConfig(app);

    // デフォルト値を設定
    remoteConfig.defaultConfig = defaultValues;

    // 開発環境では最小フェッチインターバルを短くする
    if (process.env.NODE_ENV === 'development') {
      remoteConfig.settings.minimumFetchIntervalMillis = 0;
    }

    // リモート設定を取得してアクティブ化
    await fetchAndActivate(remoteConfig);

    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Remote Config:', error);
    // エラーの場合はデフォルト値を使用
  }
}

/**
 * API サーバーの URL を取得
 */
export function getApiServerUrl(): string {
  if (!isInitialized || !remoteConfig) {
    console.warn('Remote Config not initialized, using default URL');
    return defaultValues.api_server_url;
  }

  try {
    const value = getValue(remoteConfig, 'api_server_url');
    const url = value.asString();
    return url || defaultValues.api_server_url;
  } catch (error) {
    console.error('Failed to get API server URL from Remote Config:', error);
    return defaultValues.api_server_url;
  }
}

/**
 * Remote Config の値を再取得
 */
export async function refreshRemoteConfig() {
  if (!remoteConfig) {
    console.warn('Remote Config not initialized');
    return;
  }

  try {
    await fetchAndActivate(remoteConfig);
  } catch (error) {
    console.error('Failed to refresh Remote Config:', error);
  }
}
