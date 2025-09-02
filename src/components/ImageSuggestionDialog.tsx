'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import type { SuggestedImage } from '@/domain/types/SearchTypes';

interface ImageSuggestionDialogProps {
  onImageSelect: (imageUrl: string, filename: string) => void;
  getSuggestedImages: () => Promise<SuggestedImage[]>;
  onRefresh?: () => Promise<SuggestedImage[]>;
}

export function ImageSuggestionDialog({
  onImageSelect,
  getSuggestedImages,
  onRefresh,
}: ImageSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleOpenDialog = async () => {
    if (!open) {
      setOpen(true);
      setLoading(true);

      try {
        const images = await getSuggestedImages();
        setSuggestedImages(images);
      } catch (error) {
        console.error('Failed to get suggested images:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageSelect = (image: SuggestedImage, index: number) => {
    setSelectedImageIndex(index);

    if (image.url) {
      // URLとファイル名を親に渡す（親側でFileオブジェクトに変換）
      console.log('Selected image:', image.filename, image.url);
      onImageSelect(image.url, image.filename);
      setOpen(false);
      setSelectedImageIndex(null);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedImageIndex(null);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSuggestedImages([]);
    setSelectedImageIndex(null);

    try {
      const images = onRefresh ? await onRefresh() : await getSuggestedImages();
      setSuggestedImages(images);
    } catch (error) {
      console.error('Failed to refresh suggested images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      handleOpenDialog();
    } else {
      handleCloseDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Lightbulb className="mr-2 h-4 w-4" />
          画像を提案
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>画像提案</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              再提案
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            画像を取得中...
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
            {suggestedImages.map((image, index) => (
              <Card
                key={index}
                className={`
                  cursor-pointer transition-all hover:shadow-md
                  ${selectedImageIndex === index ? 'ring-2 ring-primary' : ''}
                `}
                onClick={() => handleImageSelect(image, index)}
              >
                <div className="aspect-square overflow-hidden rounded-lg">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <div className="text-xs text-muted-foreground truncate">{image.filename}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && suggestedImages.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">提案できる画像がありません</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
