'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/firebase/context/auth';
import { logout } from '@/firebase/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/SearchForm';
import { SimilarityWeightSlider } from '@/components/SimilarityWeightSlider';
import { SearchResults } from '@/components/SearchResults';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import { SearchRepositoryImpl } from '@/infrastructure/SearchRepositoryImpl';
import { FirebaseImageStorageService } from '@/infrastructure/FirebaseImageStorageService';
import type {
  SearchRequest,
  SearchResult,
  SimilarityWeight,
  SuggestedImage,
} from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';
import { LogOut } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [similarityWeight, setSimilarityWeight] = useState<SimilarityWeight>({
    textWeight: 0.5,
    imageWeight: 0.5,
  });
  const [rankedResults, setRankedResults] = useState<PlaceWithScore[]>([]);

  // 画像提案のキューシステム
  const [suggestedImagesQueue, setSuggestedImagesQueue] = useState<SuggestedImage[][]>([]);
  const [currentSuggestedImages, setCurrentSuggestedImages] = useState<SuggestedImage[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

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

      // 現在の類似度重みで結果をランキング
      const ranked = searchUseCase.calculateRankedResults(result, similarityWeight, 10);
      setRankedResults(ranked);
    } catch (error) {
      console.error('検索エラー:', error);
      // エラーハンドリング（必要に応じてトースト通知等を追加）
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeightChange = useCallback(
    (weight: SimilarityWeight) => {
      setSimilarityWeight(weight);

      // 検索結果が既にある場合は再計算
      if (searchResult) {
        const ranked = searchUseCase.calculateRankedResults(searchResult, weight, 10);
        setRankedResults(ranked);
      }
    },
    [searchResult, searchUseCase]
  );

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
    setIsLoadingSuggestions(true);

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
    } finally {
      setIsLoadingSuggestions(false);
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">観光地検索システム</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 検索フォーム */}
          <SearchForm
            onSearch={handleSearch}
            getSuggestedImages={getSuggestedImages}
            onRefresh={handleRefreshSuggestedImages}
            isLoading={isLoading}
          />

          {/* 類似度調整スライダー（検索結果がある場合のみ表示） */}
          {searchResult && (
            <SimilarityWeightSlider onWeightChange={handleWeightChange} disabled={isLoading} />
          )}

          {/* 検索結果 */}
          {rankedResults.length > 0 && (
            <SearchResults results={rankedResults} getImageUrl={getPlaceImageUrl} />
          )}

          {/* 初回表示時の案内 */}
          {!searchResult && !isLoading && (
            <div className="text-center py-16">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  テキストまたは画像で観光地を検索
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  キーワードや画像を使って、お気に入りの観光地を見つけましょう。
                  どちらか一方の入力で検索可能です。
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
