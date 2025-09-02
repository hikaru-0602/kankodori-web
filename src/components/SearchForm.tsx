'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { ImageDropArea } from './ImageDropArea';
import { ImageSuggestionDialog } from './ImageSuggestionDialog';
import type { SearchRequest, SuggestedImage } from '@/domain/types/SearchTypes';

interface SearchFormProps {
  onSearch: (request: SearchRequest) => Promise<void>;
  getSuggestedImages: () => Promise<SuggestedImage[]>;
  isLoading: boolean;
}

export function SearchForm({ onSearch, getSuggestedImages, isLoading }: SearchFormProps) {
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
      // URLから画像を取得してFileオブジェクトを作成
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });
      setSelectedImage(file);
    } catch (error) {
      console.error('Failed to convert image to File:', error);
    }
  };

  const isSubmitDisabled = (!searchText.trim() && !selectedImage) || isLoading;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">観光地検索</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="search-text">検索テキスト</Label>
            <Input
              id="search-text"
              type="text"
              placeholder="例：美しい海岸線"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>検索画像</Label>
            <div className="space-y-3">
              <ImageDropArea
                selectedImage={selectedImage}
                onImageSelect={setSelectedImage}
              />
              <ImageSuggestionDialog
                onImageSelect={handleSuggestedImageSelect}
                getSuggestedImages={getSuggestedImages}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitDisabled}
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                検索中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                検索
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            ※ テキストまたは画像のどちらか一方は必須です
          </div>
        </form>
      </CardContent>
    </Card>
  );
}