import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import type { ImageStorageService } from '@/usecase/SearchUseCase';

export class FirebaseImageStorageService implements ImageStorageService {
  private storage = getStorage();

  async getImageUrl(directory: string, filename: string): Promise<string> {
    try {
      const imageRef = ref(this.storage, `${directory}/${filename}`);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.warn(`Failed to get image URL for ${directory}/${filename}:`, error);
      // フォールバック：プレースホルダー画像やエラー画像のURLを返すことも可能
      throw error;
    }
  }
}