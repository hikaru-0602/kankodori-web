'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import type { PlaceWithScore } from '@/domain/entities/Place';

export interface SearchResultsProps {
  results: PlaceWithScore[];
  getImageUrl: (placeId: string) => Promise<string>;
}

interface PlaceWithImageUrl extends PlaceWithScore {
  imageUrl?: string;
  imageLoading: boolean;
  imageError: boolean;
}

export function SearchResults({ results, getImageUrl }: SearchResultsProps) {
  const [placesWithImages, setPlacesWithImages] = useState<PlaceWithImageUrl[]>([]);

  // Calculate average text similarity for top 10 results
  const averageTextSimilarity = useMemo(() => {
    const top10 = results.slice(0, 10);
    if (top10.length === 0) return 0;

    const sum = top10.reduce((acc, place) => acc + place.textSimilarity, 0);
    return sum / top10.length;
  }, [results]);

  useEffect(() => {
    const initialPlaces: PlaceWithImageUrl[] = results.map(place => ({
      ...place,
      imageLoading: true,
      imageError: false,
    }));

    setPlacesWithImages(initialPlaces);

    Promise.allSettled(
      results.map(async (place, index) => {
        try {
          const imageUrl = await getImageUrl(place.id);
          console.log(`Loaded image for place ${place.id}: ${imageUrl}`);
          return { index, imageUrl };
        } catch (error) {
          console.error(`Failed to load image for place ${place.id}:`, error);
          return { index, error: true };
        }
      })
    ).then(settledResults => {
      setPlacesWithImages(prev => {
        const updated = [...prev];
        settledResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if ('imageUrl' in result.value) {
              updated[index] = {
                ...updated[index],
                imageUrl: result.value.imageUrl,
                imageLoading: false,
                imageError: false,
              };
            } else {
              updated[index] = {
                ...updated[index],
                imageLoading: false,
                imageError: true,
              };
            }
          } else {
            updated[index] = {
              ...updated[index],
              imageLoading: false,
              imageError: true,
            };
          }
        });
        return updated;
      });
    });
  }, [results, getImageUrl]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Display average text similarity */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground">
          上位10件の平均テキスト類似度
        </span>
        <span className="text-sm font-bold text-primary">
          {(averageTextSimilarity * 100).toFixed(1)}%
        </span>
      </div>

      <div className="space-y-2">
        {placesWithImages.map(place => (
          <Card
            key={place.id}
            className="group overflow-hidden transition-all duration-300 border-1 bg-card/50 backdrop-blur py-3"
          >
            <div className="flex pl-4 items-center">
              {/* Image Container */}
              <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                {place.imageLoading ? (
                  <div className="w-20 h-20 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
                  </div>
                ) : place.imageError ? (
                  <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                ) : (
                  <>
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-20 h-20 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </>
                )}
              </div>
              {/* Content */}
              <div className="flex-1 p-3 sm:p-4 space-y-1">
                <div className="">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors flex-1">
                      {place.name}
                    </h3>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="line-clamp-1">{place.location}</span>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 text-xs pt-1">
                  <span>類似度{(place.combinedScore * 100).toFixed(0)}%</span>
                  <span>テキスト{(place.textSimilarity * 100).toFixed(0)}%</span>
                  <span>画像{(place.imageSimilarity * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
