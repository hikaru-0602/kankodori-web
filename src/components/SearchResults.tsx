'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { PlaceWithScore } from '@/domain/entities/Place';

interface SearchResultsProps {
  results: PlaceWithScore[];
  getImageUrl: (placeId: string) => Promise<string>;
}

interface PlaceWithImageUrl extends PlaceWithScore {
  imageUrl?: string;
  imageLoading?: boolean;
  imageError?: boolean;
}

export function SearchResults({ results, getImageUrl }: SearchResultsProps) {
  const [placesWithImages, setPlacesWithImages] = useState<PlaceWithImageUrl[]>([]);

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          検索結果
        </h2>
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {results.length}件
        </Badge>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {placesWithImages.map((place, index) => (
          <Card
            key={place.id}
            className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-0 bg-card/50 backdrop-blur"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
              {place.imageLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative">
                    <ImageIcon className="h-12 w-12 text-muted-foreground animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                  </div>
                </div>
              ) : place.imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ImageIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                </div>
              ) : (
                <>
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}

              {/* Ranking Badge */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                <div className="bg-background/95 backdrop-blur text-foreground text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg">
                  #{index + 1}
                </div>
              </div>

              {/* Score Badge */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                <div className="bg-primary text-primary-foreground text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  {(place.combinedScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {place.name}
                </h3>

                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">{place.location}</span>
                </div>
              </div>

              {/* Similarity Scores */}
              <div className="flex gap-2 pt-2 border-t">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">画像</span>
                    <span className="text-xs font-semibold text-blue-600">
                      {(place.imageSimilarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${place.imageSimilarity * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">テキスト</span>
                    <span className="text-xs font-semibold text-green-600">
                      {(place.textSimilarity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${place.textSimilarity * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
