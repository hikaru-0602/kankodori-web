'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

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

  // selectedImageが変更されたらpreviewUrlを更新
  useEffect(() => {
    if (selectedImage) {
      // 以前のプレビューURLをクリーンアップ
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      // 新しいプレビューURLを生成
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
    } else {
      // selectedImageがnullの場合はプレビューURLをクリア
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }

    // クリーンアップ関数
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImage]); // selectedImageが変更された時に実行

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
        <Card className="relative p-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Selected image"
              className="w-full h-48 object-cover rounded-lg"
            />
            <Button
              onClick={handleRemove}
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground truncate">{selectedImage.name}</div>
        </Card>
      ) : (
        <Card
          className={`
            border-2 border-dashed p-8 text-center cursor-pointer transition-colors
            ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            hover:border-primary hover:bg-primary/5
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="h-12 w-12 text-primary" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-lg font-medium">
                {isDragOver ? '画像をドロップしてください' : '画像を選択または D&D'}
              </div>
              <div className="text-sm text-muted-foreground">
                JPG, PNG, GIF などの画像ファイルをサポート
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
