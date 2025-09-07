import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';
import { getAuth } from 'firebase/auth';
import { getApiServerUrl } from '@/firebase/lib/firebase';

let apiClient: ReturnType<typeof createClient<paths>> | null = null;

export const initializeApiClient = async (): Promise<ReturnType<typeof createClient<paths>>> => {
  if (!apiClient) {
    const baseUrl = await getApiServerUrl();
    apiClient = createClient<paths>({ baseUrl });

    // リクエストごとにユーザーUIDをヘッダーに追加するインターセプター
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
  }

  return apiClient;
};

export const getApiClient = async (): Promise<ReturnType<typeof createClient<paths>>> => {
  return await initializeApiClient();
};

export default getApiClient;
