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

  // 初期化時に結果をランキング
  useEffect(() => {
    if (searchResult) {
      const ranked = searchUseCase.calculateRankedResults(searchResult, similarityWeight, 10);
      setRankedResults(ranked);
    }
  }, [searchResult, searchUseCase, similarityWeight]);

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
        <SimilarityWeightSlider onWeightChange={handleWeightChange} disabled={isLoading} />
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
