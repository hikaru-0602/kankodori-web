import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';
import { getAuth } from 'firebase/auth';
import { getApiServerUrl, initializeRemoteConfig } from '@/lib/remote-config';

// 動的にベースURLを取得するAPIクライアント
let apiClient: ReturnType<typeof createClient<paths>> | null = null;

// Remote Configを初期化してAPIクライアントを作成
async function initializeApiClient() {
  await initializeRemoteConfig();
  const baseUrl = getApiServerUrl();

  apiClient = createClient<paths>({ baseUrl });

  // リクエストインターセプターを設定
  apiClient.use({
    async onRequest({ request }) {
      // ngrokのブラウザ警告をスキップ
      request.headers.set('ngrok-skip-browser-warning', 'true');

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        request.headers.set('X-User-Id', user.uid);

        // Firebase IDトークンを取得してAuthorizationヘッダーに追加
        try {
          const idToken = await user.getIdToken();
          request.headers.set('Authorization', `Bearer ${idToken}`);
        } catch (error) {
          console.error('Failed to get ID token:', error);
        }
      }
    },
  });

  return apiClient;
}

// APIクライアントを取得する関数（初期化を待つ）
export async function getApiClient() {
  if (!apiClient) {
    await initializeApiClient();
  }
  return apiClient!;
}

// デフォルトエクスポート用の非同期初期化
let defaultClientPromise: Promise<ReturnType<typeof createClient<paths>>> | null = null;

function getDefaultClient() {
  if (!defaultClientPromise) {
    defaultClientPromise = initializeApiClient();
  }
  return defaultClientPromise;
}

export default getDefaultClient();
