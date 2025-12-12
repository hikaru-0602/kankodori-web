'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import { SearchRepositoryImpl } from '@/infrastructure/SearchRepositoryImpl';
import { FirebaseImageStorageService } from '@/infrastructure/FirebaseImageStorageService';
import type { SearchRequest } from '@/domain/types/SearchTypes';

interface ImageBatchSearchResult {
  imageUrl: string;
  average: number;
  range: number;
  max: number;
  min: number;
}

export default function ImageBatchReportPage() {
  const [text, setText] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImageBatchSearchResult[]>([]);

  const searchRepository = new SearchRepositoryImpl();
  const imageStorageService = new FirebaseImageStorageService();
  const searchUseCase = new SearchUseCase(searchRepository, imageStorageService);

  const processBatchSearch = async () => {
    if (!text.trim() || !imageUrls.trim()) {
      alert('テキストと画像URLを入力してください');
      return;
    }

    setIsProcessing(true);
    setResults([]);

    const urlArray = imageUrls
      .split(',')
      .map(url => url.trim())
      .filter(url => url);
    const tempResults: ImageBatchSearchResult[] = [];

    for (const imageUrl of urlArray) {
      try {
        // プロキシAPI経由で画像を取得
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          console.error(`Failed to fetch image from URL: ${imageUrl}`);
          continue;
        }

        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });

        const searchRequest: SearchRequest = {
          text,
          image: file,
        };

        const searchResult = await searchUseCase.search(searchRequest);

        if (searchResult.places && searchResult.places.length > 0) {
          const imageSimilarities = searchResult.places.map((place: any) => place.imageSimilarity);
          const max = Math.max(...imageSimilarities);
          const min = Math.min(...imageSimilarities);
          const average =
            imageSimilarities.reduce((sum: number, val: number) => sum + val, 0) /
            imageSimilarities.length;

          tempResults.push({
            imageUrl: imageUrl.length > 50 ? imageUrl.substring(0, 50) + '...' : imageUrl,
            average,
            range: max - min,
            max,
            min,
          });
        }
      } catch (error) {
        console.error(`Error processing image URL: ${imageUrl}`, error);
      }
    }

    setResults(tempResults);
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">画像バッチ検索レポート</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              検索テキスト（全ての画像で共通使用）
            </label>
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="検索テキストを入力"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              画像URL（カンマ区切りで複数入力）
            </label>
            <Textarea
              value={imageUrls}
              onChange={e => setImageUrls(e.target.value)}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg, ..."
              className="min-h-[200px]"
            />
          </div>

          <Button
            onClick={processBatchSearch}
            disabled={isProcessing || !text.trim() || !imageUrls.trim()}
            className="w-full"
          >
            {isProcessing ? '処理中...' : '検索実行'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="font-medium mb-2">
                    検索 {index + 1}: {result.imageUrl}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">画像類似度平均:</span>{' '}
                      <span className="font-semibold">{(result.average * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">範囲 (最大-最小):</span>{' '}
                      <span className="font-semibold">{(result.range * 100).toFixed(2)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      最大: {(result.max * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      最小: {(result.min * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}