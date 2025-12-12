'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import { SearchRepositoryImpl } from '@/infrastructure/SearchRepositoryImpl';
import { FirebaseImageStorageService } from '@/infrastructure/FirebaseImageStorageService';
import type { SearchRequest, SimilarityWeight } from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';

interface WeightResult {
  weight: number; // テキストの重み (0, 25, 50, 75, 100)
  topPlace: PlaceWithScore | null;
}

interface CrossSearchResult {
  text: string;
  fullText: string; // フルテキスト
  imageUrl: string;
  fullImageUrl: string; // フル画像URL
  results: WeightResult[];
  uniqueCount: number; // ユニークな結果の数
}

export default function CrossSearchPage() {
  const [texts, setTexts] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [allResults, setAllResults] = useState<CrossSearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<CrossSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  const searchRepository = new SearchRepositoryImpl();
  const imageStorageService = new FirebaseImageStorageService();
  const searchUseCase = new SearchUseCase(searchRepository, imageStorageService);

  const weights = [0, 25, 50, 75, 100]; // テキストの重み（%）

  const processCrossSearch = async () => {
    if (!texts.trim() || !imageUrls.trim()) {
      alert('テキストと画像URLを入力してください');
      return;
    }

    setIsProcessing(true);
    setAllResults([]);
    setFilteredResults([]);

    const textArray = texts
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    const urlArray = imageUrls
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const tempResults: CrossSearchResult[] = [];

    // 全ての組み合わせで検索
    for (const text of textArray) {
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

          // 検索を実行
          const searchResult = await searchUseCase.search(searchRequest);

          if (searchResult.places && searchResult.places.length > 0) {
            const weightResults: WeightResult[] = [];

            // 5つの重み付けパターンで結果を計算
            for (const weight of weights) {
              const similarityWeight: SimilarityWeight = {
                textWeight: weight / 100,
                imageWeight: (100 - weight) / 100,
              };

              const ranked = searchUseCase.calculateRankedResults(
                searchResult,
                similarityWeight,
                1 // 上位1件のみ
              );

              weightResults.push({
                weight,
                topPlace: ranked[0] || null,
              });
            }

            // ユニークな結果の数を計算
            const uniquePlaces = new Set(
              weightResults
                .filter(r => r.topPlace !== null)
                .map(r => r.topPlace!.name)
            );

            const result: CrossSearchResult = {
              text: text.length > 30 ? text.substring(0, 30) + '...' : text,
              fullText: text,
              imageUrl: imageUrl.length > 30 ? imageUrl.substring(0, 30) + '...' : imageUrl,
              fullImageUrl: imageUrl,
              results: weightResults,
              uniqueCount: uniquePlaces.size,
            };

            tempResults.push(result);
          }
        } catch (error) {
          console.error(`Error processing: ${text} with ${imageUrl}`, error);
        }
      }
    }

    // 3種類以上の結果があるものだけフィルタリング
    const filtered = tempResults.filter(result => result.uniqueCount >= 3);

    setAllResults(tempResults);
    setFilteredResults(filtered);
    setTotalCount(tempResults.length);
    setFilteredCount(filtered.length);
    setIsProcessing(false);
  };

  const getPercentage = () => {
    if (totalCount === 0) return 0;
    return ((filteredCount / totalCount) * 100).toFixed(1);
  };

  // 各ユニーク数の件数を集計
  const getUniqueCountDistribution = () => {
    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allResults.forEach(result => {
      if (result.uniqueCount >= 1 && result.uniqueCount <= 5) {
        distribution[result.uniqueCount]++;
      }
    });
    return distribution;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">総当たり検索</h1>

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
              className="min-h-[150px]"
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
              className="min-h-[150px]"
            />
          </div>

          <Button
            onClick={processCrossSearch}
            disabled={isProcessing || !texts.trim() || !imageUrls.trim()}
            className="w-full"
          >
            {isProcessing ? '処理中...' : '検索実行'}
          </Button>
        </CardContent>
      </Card>

      {allResults.length > 0 && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-lg">
                  <span className="font-bold text-2xl text-primary">{filteredCount}</span>
                  <span className="text-muted-foreground"> / {totalCount} 件</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getPercentage()}% が3種類以上の異なる結果を持っています
                </p>
              </div>

              {/* 各種類の件数表示 */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-semibold mb-2 text-center">結果の分布</p>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(count => {
                    const distribution = getUniqueCountDistribution();
                    const isHighlighted = count >= 3;
                    return (
                      <div
                        key={count}
                        className={`text-center p-2 rounded ${
                          isHighlighted ? 'bg-primary/10 border border-primary/20' : 'bg-secondary'
                        }`}
                      >
                        <p className="text-xs text-muted-foreground">{count}種類</p>
                        <p className={`font-bold ${isHighlighted ? 'text-primary' : ''}`}>
                          {distribution[count]}件
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>検索結果（3種類以上の結果を持つもののみ）</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={`/api/proxy-image?url=${encodeURIComponent(result.fullImageUrl)}`}
                          alt="検索画像"
                          className="h-20 w-20 object-cover rounded-lg border"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          テキスト: <span className="text-primary">{result.text}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          画像URL: <a
                            href={result.fullImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            title={result.fullImageUrl}
                          >
                            {result.imageUrl}
                          </a>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.uniqueCount}種類の異なる結果
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {result.results.map((weightResult, wIndex) => (
                        <div
                          key={wIndex}
                          className="border rounded p-2 text-xs bg-card"
                        >
                          <div className="font-semibold mb-1 text-center">
                            T:{weightResult.weight}% I:{100 - weightResult.weight}%
                          </div>
                          {weightResult.topPlace ? (
                            <div>
                              <p className="font-medium line-clamp-2">
                                {weightResult.topPlace.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                スコア: {(weightResult.topPlace.combinedScore * 100).toFixed(1)}%
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">結果なし</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}
        </>
      )}

      {totalCount > 0 && filteredCount === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              3種類以上の異なる結果を持つ検索結果はありませんでした。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}