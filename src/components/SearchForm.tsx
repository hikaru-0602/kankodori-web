'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { ImageDropArea } from './ImageDropArea';
import { ImageSuggestionDialog } from './ImageSuggestionDialog';
import type { SearchRequest, SuggestedImage } from '@/domain/types/SearchTypes';

interface SearchFormProps {
  onSearch: (request: SearchRequest) => Promise<void>;
  getSuggestedImages: () => Promise<SuggestedImage[]>;
  onRefresh?: () => Promise<SuggestedImage[]>;
  isLoading: boolean;
}

export function SearchForm({
  onSearch,
  getSuggestedImages,
  onRefresh,
  isLoading,
}: SearchFormProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchText.trim() && !selectedImage) {
      return;
    }

    const request: SearchRequest = {};

    if (searchText.trim()) {
      request.text = searchText.trim();
    }

    if (selectedImage) {
      request.image = selectedImage;
    }

    await onSearch(request);
  };

  const handleSuggestedImageSelect = async (imageUrl: string, filename: string) => {
    try {
      // プロキシ経由で画像を取得してCORSエラーを回避
      console.log('Converting suggested image URL to File:', imageUrl);
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      setSelectedImage(file);
      console.log('Successfully converted to File:', file);
    } catch (error) {
      console.error('Failed to convert image to File:', error);
      alert(`画像の変換に失敗しました: ${error}`);
    }
  };

  const isSubmitDisabled = (!searchText.trim() && !selectedImage) || isLoading;

  return (
    <Card className="w-full border-1 bg-card/50 backdrop-blur pt-4 pb-2">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Text Search Section */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                id="search-text"
                type="text"
                placeholder="例：美しい海岸線、歴史的建造物"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                disabled={isLoading}
                className="pr-10 h-12 text-base bg-background/50"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Image Search Section */}
          <div className="space-y-2">
            <div className="space-y-3">
              <ImageDropArea selectedImage={selectedImage} onImageSelect={setSelectedImage} />
              <ImageSuggestionDialog
                onImageSelect={handleSuggestedImageSelect}
                getSuggestedImages={getSuggestedImages}
                onRefresh={onRefresh}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isSubmitDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                検索中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                検索する
              </>
            )}
          </Button>

          {/* Helper Text */}
          {!searchText && !selectedImage && (
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              キーワードか画像のどちらかを入力してください
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
