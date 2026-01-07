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

interface BatchSearchResult {
  text: string;
  average: number;
  variance: number;
  max: number;
  min: number;
}

export default function BatchReportPage() {
  const [texts, setTexts] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchSearchResult[]>([]);

  const searchRepository = new SearchRepositoryImpl();
  const imageStorageService = new FirebaseImageStorageService();
  const searchUseCase = new SearchUseCase(searchRepository, imageStorageService);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processBatchSearch = async () => {
    if (!texts.trim() || !imageFile) {
      alert('テキストと画像を入力してください');
      return;
    }

    setIsProcessing(true);
    setResults([]);

    const textArray = texts
      .split(',')
      .map(t => t.trim())
      .filter(t => t);
    const tempResults: BatchSearchResult[] = [];

    for (const text of textArray) {
      try {
        const searchRequest: SearchRequest = {
          text,
          image: imageFile,
        };

        const searchResult = await searchUseCase.search(searchRequest);

        if (searchResult.places && searchResult.places.length > 0) {
          const textSimilarities = searchResult.places.map((place: any) => place.textSimilarity);
          const max = Math.max(...textSimilarities);
          const min = Math.min(...textSimilarities);
          const average =
            textSimilarities.reduce((sum: number, val: number) => sum + val, 0) /
            textSimilarities.length;

          // 上位10件の分散を計算
          const top10 = textSimilarities.slice(0, 10);
          const top10Average =
            top10.reduce((sum: number, val: number) => sum + val, 0) / top10.length;
          const variance =
            top10.length > 0
              ? top10.reduce(
                  (sum: number, val: number) => sum + Math.pow(val - top10Average, 2),
                  0
                ) / top10.length
              : 0;

          tempResults.push({
            text: text.length > 50 ? text.substring(0, 50) + '...' : text,
            average,
            variance,
            max,
            min,
          });
        }
      } catch (error) {
        console.error(`Error processing text: ${text}`, error);
      }
    }

    setResults(tempResults);
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">バッチ検索レポート</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>入力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              テキスト（カンマ区切りで複数入力）
            </label>
            <Textarea
              value={texts}
              onChange={e => setTexts(e.target.value)}
              placeholder="テキスト1, テキスト2, テキスト3..."
              className="min-h-[200px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">画像選択</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 h-32 object-contain" />
            )}
          </div>

          <Button
            onClick={processBatchSearch}
            disabled={isProcessing || !texts.trim() || !imageFile}
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
                    検索 {index + 1}: {result.text}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">平均値:</span>{' '}
                      <span className="font-semibold">{(result.average * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">上位10件の分散:</span>{' '}
                      <span className="font-semibold">{(result.variance * 10000).toFixed(2)}</span>
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
