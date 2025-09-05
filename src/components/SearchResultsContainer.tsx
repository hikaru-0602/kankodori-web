'use client';

import { useState, useCallback, useEffect } from 'react';
import { SimilarityWeightSlider } from './SimilarityWeightSlider';
import { SearchResults } from './SearchResults';
import { SearchResultsSkeleton } from './SearchResultsSkeleton';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import type { SearchResult, SimilarityWeight } from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';

interface SearchResultsContainerProps {
  searchResult: SearchResult | null;
  searchUseCase: SearchUseCase;
  getPlaceImageUrl: (placeId: string) => Promise<string>;
  isLoading?: boolean;
}

export function SearchResultsContainer({
  searchResult,
  searchUseCase,
  getPlaceImageUrl,
  isLoading = false,
}: SearchResultsContainerProps) {
  const [similarityWeight, setSimilarityWeight] = useState<SimilarityWeight>({
    textWeight: 0.5,
    imageWeight: 0.5,
  });
  const [rankedResults, setRankedResults] = useState<PlaceWithScore[]>([]);
  const [resetSlider, setResetSlider] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // 検索完了後の処理
  useEffect(() => {
    if (searchResult && !isLoading) {
      // APIからデータ取得完了後、スライダーをリセットして計算
      const defaultWeight: SimilarityWeight = {
        textWeight: 0.5,
        imageWeight: 0.5,
      };
      setSimilarityWeight(defaultWeight);
      setResetSlider(prev => !prev);
      
      const ranked = searchUseCase.calculateRankedResults(searchResult, defaultWeight, 10);
      setRankedResults(ranked);
      setHasResults(true);
    }
  }, [searchResult, isLoading, searchUseCase]);

  const handleWeightChange = useCallback(
    (weight: SimilarityWeight) => {
      setSimilarityWeight(weight);

      // 検索結果がある場合は再計算
      if (searchResult && !isLoading) {
        setIsCalculating(true);
        
        // 計算処理に少し遅延を入れてスケルトンUIを表示
        setTimeout(() => {
          const ranked = searchUseCase.calculateRankedResults(searchResult, weight, 10);
          setRankedResults(ranked);
          setIsCalculating(false);
        }, 200);
      }
    },
    [searchResult, isLoading, searchUseCase]
  );

  // 検索開始時のリセット
  useEffect(() => {
    if (isLoading) {
      setHasResults(false);
      setRankedResults([]);
      setIsCalculating(false);
    }
  }, [isLoading]);

  // スケルトン表示の条件：検索中 OR 計算中
  const showSkeleton = isLoading || isCalculating;
  // 結果表示の条件：検索中でなく、計算中でなく、結果がある
  const showResults = !isLoading && !isCalculating && rankedResults.length > 0;
  // スライダー表示の条件：結果があるか、検索中のいずれか
  const showSlider = hasResults || isLoading;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Similarity Slider */}
      {showSlider && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
          <SimilarityWeightSlider 
            onWeightChange={handleWeightChange} 
            disabled={isLoading || isCalculating}
            reset={resetSlider}
          />
        </div>
      )}

      {/* Search Results or Skeleton */}
      {showSkeleton && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
          <SearchResultsSkeleton />
        </div>
      )}
      
      {showResults && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
          <SearchResults results={rankedResults} getImageUrl={getPlaceImageUrl} />
        </div>
      )}
    </div>
  );
}
