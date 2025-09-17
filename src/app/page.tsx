'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/firebase/context/auth';
import { logout } from '@/firebase/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/SearchForm';
import { SearchResultsContainer } from '@/components/SearchResultsContainer';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import { SearchRepositoryImpl } from '@/infrastructure/SearchRepositoryImpl';
import { FirebaseImageStorageService } from '@/infrastructure/FirebaseImageStorageService';
import type { SearchRequest, SearchResult, SuggestedImage } from '@/domain/types/SearchTypes';
import { LogOut, FileText, Image } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // 画像提案のキューシステム
  const [suggestedImagesQueue, setSuggestedImagesQueue] = useState<SuggestedImage[][]>([]);
  const [currentSuggestedImages, setCurrentSuggestedImages] = useState<SuggestedImage[]>([]);

  // Use cases and services
  const searchRepository = new SearchRepositoryImpl();
  const imageStorageService = new FirebaseImageStorageService();
  const searchUseCase = new SearchUseCase(searchRepository, imageStorageService);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleSearch = async (request: SearchRequest) => {
    setIsLoading(true);
    try {
      const result = await searchUseCase.search(request);
      setSearchResult(result);
    } catch (error) {
      console.error('検索エラー:', error);
      // エラーハンドリング（必要に応じてトースト通知等を追加）
    } finally {
      setIsLoading(false);
    }
  };

  // 画像提案を取得してキューに追加する関数
  const fetchSuggestedImagesForQueue = async () => {
    try {
      const images = await searchUseCase.getSuggestedImages();
      setSuggestedImagesQueue(prev => [...prev, images]);
      return images;
    } catch (error) {
      console.error('Failed to fetch suggested images:', error);
      return [];
    }
  };

  // キューから次の画像提案を取得する関数
  const getNextSuggestedImages = (): SuggestedImage[] => {
    if (suggestedImagesQueue.length === 0) {
      return [];
    }

    const nextImages = suggestedImagesQueue[0];
    setSuggestedImagesQueue(prev => prev.slice(1));

    // 次のデータを事前取得
    if (suggestedImagesQueue.length === 1) {
      fetchSuggestedImagesForQueue();
    }

    return nextImages;
  };

  // ImageSuggestionDialog用の関数（既存のインターフェースを保持）
  const getSuggestedImages = async (): Promise<SuggestedImage[]> => {
    // キューに画像がある場合はそれを使用
    if (currentSuggestedImages.length > 0) {
      return currentSuggestedImages;
    }

    // キューが空の場合は直接取得
    return await searchUseCase.getSuggestedImages();
  };

  // 再提案機能：キューから次の画像を取得
  const handleRefreshSuggestedImages = async (): Promise<SuggestedImage[]> => {
    try {
      const nextImages = getNextSuggestedImages();

      if (nextImages.length > 0) {
        setCurrentSuggestedImages(nextImages);
        return nextImages;
      } else {
        // キューが空の場合は直接取得
        const images = await searchUseCase.getSuggestedImages();
        setCurrentSuggestedImages(images);
        return images;
      }
    } catch (error) {
      console.error('Failed to refresh suggested images:', error);
      return [];
    }
  };

  const getPlaceImageUrl = async (placeId: string) => {
    return await imageStorageService.getImageUrl('api/photo', `${placeId}.jpg`);
  };

  // ページ読み込み時の初期化処理
  useEffect(() => {
    const initializeSuggestedImages = async () => {
      // 最初の画像提案を取得
      const firstImages = await fetchSuggestedImagesForQueue();
      setCurrentSuggestedImages(firstImages);

      // 2つ目の画像提案も事前取得
      await fetchSuggestedImagesForQueue();
    };

    if (user) {
      initializeSuggestedImages();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Responsive Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              観光地検索システム
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline-block text-xs sm:text-sm text-muted-foreground truncate max-w-[150px]"></span>
              <Button onClick={() => router.push('/batch-report')} variant="outline" size="sm" className="hidden sm:flex">
                <FileText className="h-4 w-4 mr-2" />
                バッチレポート
              </Button>
              <Button onClick={() => router.push('/image-batch-report')} variant="outline" size="sm" className="hidden sm:flex">
                <Image className="h-4 w-4 mr-2" />
                画像バッチ
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="icon" className="sm:hidden">
                <LogOut className="h-5 w-5" />
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="hidden sm:flex">
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Better Mobile Layout */}
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* Search Form Card */}
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <SearchForm
              onSearch={handleSearch}
              getSuggestedImages={getSuggestedImages}
              onRefresh={handleRefreshSuggestedImages}
              isLoading={isLoading}
            />
          </div>

          {/* Search Results Container */}
          {(searchResult || isLoading) && (
            <SearchResultsContainer
              searchResult={searchResult}
              searchUseCase={searchUseCase}
              getPlaceImageUrl={getPlaceImageUrl}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}
