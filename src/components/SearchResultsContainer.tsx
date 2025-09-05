'use client';

import { useState, useCallback, useEffect } from 'react';
import { SimilarityWeightSlider } from './SimilarityWeightSlider';
import { SearchResults } from './SearchResults';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import type { SearchResult, SimilarityWeight } from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';

interface SearchResultsContainerProps {
  searchResult: SearchResult;
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

  // 初期化時に結果をランキング
  useEffect(() => {
    if (searchResult) {
      // 検索毎にスライダーを50%にリセット
      const defaultWeight: SimilarityWeight = {
        textWeight: 0.5,
        imageWeight: 0.5,
      };
      setSimilarityWeight(defaultWeight);
      setResetSlider(prev => !prev); // スライダーをリセットするためのフラグを切り替え
      const ranked = searchUseCase.calculateRankedResults(searchResult, defaultWeight, 10);
      setRankedResults(ranked);
    }
  }, [searchResult, searchUseCase]);

  const handleWeightChange = useCallback(
    (weight: SimilarityWeight) => {
      setSimilarityWeight(weight);

      // 検索結果がある場合は再計算
      if (searchResult) {
        const ranked = searchUseCase.calculateRankedResults(searchResult, weight, 10);
        setRankedResults(ranked);
      }
    },
    [searchResult, searchUseCase]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Similarity Slider */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
        <SimilarityWeightSlider 
          onWeightChange={handleWeightChange} 
          disabled={isLoading}
          reset={resetSlider}
        />
      </div>

      {/* Search Results */}
      {rankedResults.length > 0 && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
          <SearchResults results={rankedResults} getImageUrl={getPlaceImageUrl} />
        </div>
      )}
    </div>
  );
}
