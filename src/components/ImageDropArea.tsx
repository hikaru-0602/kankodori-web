'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageDropAreaProps {
  selectedImage: File | null;
  onImageSelect: (image: File | null) => void;
}

export function ImageDropArea({ selectedImage, onImageSelect }: ImageDropAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleImageSelect = useCallback(
    (file: File) => {
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));

      if (imageFile) {
        handleImageSelect(imageFile);
      }
    },
    [handleImageSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleImageSelect(file);
      }
    },
    [handleImageSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageSelect]);

  useEffect(() => {
    if (selectedImage) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
    } else {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImage]);

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {selectedImage && previewUrl ? (
        <Card className="relative p-3 sm:p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Selected image"
              className="w-full h-32 sm:h-48 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
            <Button
              onClick={handleRemove}
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 opacity-90 hover:opacity-100 shadow-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">
                {selectedImage.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {(selectedImage.size / 1024).toFixed(0)} KB
            </span>
          </div>
        </Card>
      ) : (
        <Card
          className={`
            relative overflow-hidden border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer 
            transition-all duration-300 group
            ${isDragOver 
              ? 'border-primary bg-primary/10 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-20 h-20 bg-primary rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl animate-pulse delay-700" />
          </div>
          
          <div className="relative space-y-3 sm:space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                {isDragOver ? (
                  <>
                    <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-bounce" />
                    <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 animate-spin" />
                  </>
                ) : (
                  <div className="relative group">
                    <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <div className="text-base sm:text-lg font-medium">
                {isDragOver ? (
                  <span className="text-primary animate-pulse">画像をドロップ</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">クリックまたはドラッグ＆ドロップ</span>
                    <span className="sm:hidden">タップして画像を選択</span>
                  </>
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                JPG, PNG, GIF, WEBP 対応
              </div>
            </div>

            {/* Mobile-friendly tap area indicator */}
            <div className="sm:hidden mt-2">
              <div className="inline-flex items-center justify-center w-full">
                <div className="h-10 px-4 py-2 bg-primary/10 rounded-full">
                  <span className="text-xs font-medium text-primary">タップして選択</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}