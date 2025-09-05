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
import type {
  SearchRequest,
  SearchResult,
  SuggestedImage,
} from '@/domain/types/SearchTypes';
import { LogOut } from 'lucide-react';

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
              観光地検索
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline-block text-xs sm:text-sm text-muted-foreground truncate max-w-[150px]"></span>
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
          {searchResult && (
            <SearchResultsContainer
              searchResult={searchResult}
              searchUseCase={searchUseCase}
              getPlaceImageUrl={getPlaceImageUrl}
              isLoading={isLoading}
            />
          )}

          {/* Welcome Message with Better Mobile Design */}
          {!searchResult && !isLoading && (
            <div className="flex min-h-[50vh] items-center justify-center px-4">
              <div className="text-center space-y-6 animate-in fade-in-0 duration-1000">
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    観光地を探そう
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                    テキストや画像で理想の観光スポットを検索できます
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-8">
                  <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">キーワード検索</span>
                  </div>
                  <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-muted-foreground">画像検索</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
