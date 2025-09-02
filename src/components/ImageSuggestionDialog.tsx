'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { SuggestedImage } from '@/domain/types/SearchTypes';

interface ImageSuggestionDialogProps {
  onImageSelect: (imageUrl: string, filename: string) => void;
  getSuggestedImages: () => Promise<SuggestedImage[]>;
}

export function ImageSuggestionDialog({ onImageSelect, getSuggestedImages }: ImageSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState<SuggestedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleOpenDialog = async () => {
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
  };

  const handleImageSelect = async (image: SuggestedImage, index: number) => {
    setSelectedImageIndex(index);
    
    if (image.url) {
      // Firebase StorageのURLから画像をダウンロードしてFileオブジェクトを作成
      try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], image.filename, { type: blob.type });
        
        // Base64 URLまたはObjectURLを作成して親に渡す
        const objectUrl = URL.createObjectURL(file);
        onImageSelect(objectUrl, image.filename);
        setOpen(false);
        setSelectedImageIndex(null);
      } catch (error) {
        console.error('Failed to download image:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedImageIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={handleOpenDialog}
          className="w-full"
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          画像を提案
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>画像提案</DialogTitle>
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
                  <div className="text-xs text-muted-foreground truncate">
                    {image.filename}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {!loading && suggestedImages.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            提案できる画像がありません
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}