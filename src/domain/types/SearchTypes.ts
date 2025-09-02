export interface SearchRequest {
  text?: string;
  image?: File;
}

export interface SearchMetadata {
  actualText: string;
  textGenerated: boolean;
  imageGenerated: boolean;
  hasImage: boolean;
  originalText?: string | null;
  hasOriginalImage: boolean;
}

export interface SearchResult {
  places: Place[];
  metadata: SearchMetadata;
}

export interface SimilarityWeight {
  textWeight: number;
  imageWeight: number;
}

export const createSimilarityWeight = (percentage: number): SimilarityWeight => {
  const textWeight = percentage / 100;
  const imageWeight = 1 - textWeight;

  return {
    textWeight,
    imageWeight,
  };
};

export interface SuggestedImage {
  filename: string;
  url?: string;
}

import type { Place } from '../entities/Place';
