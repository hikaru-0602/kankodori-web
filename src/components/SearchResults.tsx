"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Image as ImageIcon } from "lucide-react";
import type { PlaceWithScore } from "@/domain/entities/Place";

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
  const [placesWithImages, setPlacesWithImages] = useState<PlaceWithImageUrl[]>(
    []
  );

  useEffect(() => {
    // 初期状態で結果を設定し、画像を非同期で読み込む
    const initialPlaces: PlaceWithImageUrl[] = results.map((place) => ({
      ...place,
      imageLoading: true,
      imageError: false,
    }));

    setPlacesWithImages(initialPlaces);

    // 各結果の画像を非同期で取得
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
    ).then((settledResults) => {
      setPlacesWithImages((prev) => {
        const updated = [...prev];
        settledResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            if ("imageUrl" in result.value) {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">検索結果</h2>
        <Badge variant="secondary" className="text-sm">
          {results.length}件
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {placesWithImages.map((place, index) => (
          <Card
            key={place.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video overflow-hidden bg-muted">
              {place.imageLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
                </div>
              ) : place.imageError ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                <Star className="h-3 w-3 mr-1" />
                {place.combinedScore.toFixed(2)}
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg leading-tight">
                  {place.name}
                </h3>

                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {place.location}
                </div>

                <div className="flex justify-between text-xs">
                  <div className="text-blue-600">
                    画像: {(place.imageSimilarity * 100).toFixed(1)}%
                  </div>
                  <div className="text-green-600">
                    テキスト: {(place.textSimilarity * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  #{index + 1}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
