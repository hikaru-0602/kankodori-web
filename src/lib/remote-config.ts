import { fetchAndActivate, getValue, type RemoteConfig } from 'firebase/remote-config';
import { getRemoteConfigInstance } from '@/firebase/lib/remoteConfig';

let remoteConfig: RemoteConfig | null = null;
let isInitialized = false;

// デフォルト値を設定
const defaultValues = {
  api_server_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3110',
};

/**
 * Remote Configを初期化（レンダリング時に毎回更新）
 */
export async function initializeRemoteConfig() {
  // サーバーサイドでは初期化しない
  if (typeof window === 'undefined') {
    console.warn('Remote Config initialization skipped on server side');
    return;
  }

  // 初回初期化
  if (!isInitialized) {
    try {
      remoteConfig = getRemoteConfigInstance();

      // デフォルト値を設定
      remoteConfig.defaultConfig = defaultValues;

      // 開発環境では最小フェッチインターバルを短くする
      if (process.env.NODE_ENV === 'development') {
        remoteConfig.settings.minimumFetchIntervalMillis = 0;
      }

      isInitialized = true;
      console.log('Remote Config initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Remote Config:', error);
      // エラーの場合はデフォルト値を使用
      return;
    }
  }

  // レンダリング時に毎回更新を試行
  if (remoteConfig) {
    try {
      await fetchAndActivate(remoteConfig);
      console.log('Remote Config refreshed on render');
    } catch (error) {
      console.error('Failed to refresh Remote Config:', error);
    }
  }
}

/**
 * API サーバーの URL を取得
 */
export function getApiServerUrl(): string {
  if (!isInitialized || !remoteConfig) {
    console.warn('[Remote Config] Not initialized, using default URL:', defaultValues.api_server_url);
    return defaultValues.api_server_url;
  }

  try {
    const value = getValue(remoteConfig, 'api_server_url');
    const url = value.asString();
    console.log('[Remote Config] Retrieved URL:', url);
    return url || defaultValues.api_server_url;
  } catch (error) {
    console.error('[Remote Config] Failed to get API server URL:', error);
    console.log('[Remote Config] Falling back to default URL:', defaultValues.api_server_url);
    return defaultValues.api_server_url;
  }
}

/**
 * Remote Config の値を手動で再取得
 */
export async function refreshRemoteConfig() {
  if (!remoteConfig) {
    console.warn('Remote Config not initialized');
    return;
  }

  try {
    await fetchAndActivate(remoteConfig);
    console.log('Remote Config manually refreshed successfully');
  } catch (error) {
    console.error('Failed to refresh Remote Config:', error);
  }
}