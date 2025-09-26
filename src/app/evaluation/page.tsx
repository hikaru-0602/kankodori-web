'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SearchUseCase } from '@/usecase/SearchUseCase';
import { SearchRepositoryImpl } from '@/infrastructure/SearchRepositoryImpl';
import { FirebaseImageStorageService } from '@/infrastructure/FirebaseImageStorageService';
import type { SearchRequest, SimilarityWeight } from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';
import { Download } from 'lucide-react';

interface EvaluationItem {
  id: number; // 1-5000の連番
  querySetId: string; // "text_image"の形式
  text: string;
  imageUrl: string;
  weight: number; // 0, 25, 50, 75, 100
  rank: number; // 1-10
  place: PlaceWithScore & { imageUrl?: string };
  evaluation: number | null; // 0-3 or null
}

interface NDCGResult {
  querySetId: string;
  text: string;
  imageUrl: string;
  weights: {
    [key: number]: number; // weight -> NDCG score
  };
  bestWeight: number;
  bestNDCG: number;
}

export default function EvaluationPage() {
  const [queryPairs, setQueryPairs] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ndcgResults, setNdcgResults] = useState<NDCGResult[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const searchRepository = new SearchRepositoryImpl();
  const imageStorageService = new FirebaseImageStorageService();
  const searchUseCase = new SearchUseCase(searchRepository, imageStorageService);

  // 自動保存
  useEffect(() => {
    if (evaluationItems.length === 0) return;

    const timer = setInterval(() => {
      localStorage.setItem('evaluation-items', JSON.stringify(evaluationItems));
      localStorage.setItem('evaluation-index', String(currentIndex));
    }, 10000); // 10秒ごと

    return () => clearInterval(timer);
  }, [evaluationItems, currentIndex]);

  // LocalStorageから復元
  const loadFromLocalStorage = () => {
    const savedItems = localStorage.getItem('evaluation-items');
    const savedIndex = localStorage.getItem('evaluation-index');

    if (savedItems) {
      const items = JSON.parse(savedItems);
      setEvaluationItems(items);

      if (savedIndex) {
        setCurrentIndex(parseInt(savedIndex));
      }

      return true;
    }
    return false;
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isEvaluating) return;

      const key = e.key;
      if (['0', '1', '2', '3'].includes(key)) {
        const evaluation = parseInt(key);
        handleEvaluation(currentIndex, evaluation);
      } else if (key === 'Enter' || key === 'Tab') {
        e.preventDefault();
        moveToNext();
      } else if (key === 'Backspace') {
        moveToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isEvaluating, currentIndex, evaluationItems]);

  const executeAllSearches = async () => {
    setIsSearching(true);
    setEvaluationItems([]);

    // クエリペアをパース
    const queryPairLines = queryPairs.split('\n').map(line => line.trim()).filter(line => line);
    const parsedPairs: { text: string; imageUrl: string }[] = [];

    for (const line of queryPairLines) {
      const [text, imageUrl] = line.split(',').map(part => part.trim());
      if (text && imageUrl) {
        parsedPairs.push({ text, imageUrl });
      }
    }

    if (parsedPairs.length === 0) {
      alert('有効なクエリペアを入力してください');
      setIsSearching(false);
      return;
    }

    const items: EvaluationItem[] = [];
    let itemId = 1;

    // 重複排除用のセット
    const processedTexts = new Set<string>();
    const processedImages = new Set<string>();
    const textOnlyResults = new Map<string, PlaceWithScore[]>();
    const imageOnlyResults = new Map<string, PlaceWithScore[]>();

    // 各クエリペアで検索
    for (let pairIndex = 0; pairIndex < parsedPairs.length; pairIndex++) {
      const { text, imageUrl } = parsedPairs[pairIndex];

      try {
        // プロキシAPI経由で画像を取得
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          console.error(`画像の取得に失敗: ${imageUrl}`);
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
          // テキスト100%の結果（重複チェック）
          if (!processedTexts.has(text)) {
            const textOnlyWeight: SimilarityWeight = {
              textWeight: 1,
              imageWeight: 0,
            };

            const ranked = searchUseCase.calculateRankedResults(
              searchResult,
              textOnlyWeight,
              10
            );

            textOnlyResults.set(text, ranked);
            processedTexts.add(text);

            ranked.forEach((place, index) => {
              items.push({
                id: itemId++,
                querySetId: `TEXT_ONLY_${text}`,
                text,
                imageUrl,
                weight: 100,
                rank: index + 1,
                place,
                evaluation: null,
              });
            });
          }

          // 画像100%の結果（重複チェック）
          if (!processedImages.has(imageUrl)) {
            const imageOnlyWeight: SimilarityWeight = {
              textWeight: 0,
              imageWeight: 1,
            };

            const ranked = searchUseCase.calculateRankedResults(
              searchResult,
              imageOnlyWeight,
              10
            );

            imageOnlyResults.set(imageUrl, ranked);
            processedImages.add(imageUrl);

            ranked.forEach((place, index) => {
              items.push({
                id: itemId++,
                querySetId: `IMAGE_ONLY_${imageUrl}`,
                text,
                imageUrl,
                weight: 0,
                rank: index + 1,
                place,
                evaluation: null,
              });
            });
          }

          // 50:50の結果（常に実行）
          const mixWeight: SimilarityWeight = {
            textWeight: 0.5,
            imageWeight: 0.5,
          };

          const ranked = searchUseCase.calculateRankedResults(
            searchResult,
            mixWeight,
            10
          );

          ranked.forEach((place, index) => {
            items.push({
              id: itemId++,
              querySetId: `${text}_${imageUrl}`,
              text,
              imageUrl,
              weight: 50,
              rank: index + 1,
              place,
              evaluation: null,
            });
          });
        }
      } catch (error) {
        console.error(`Error: ${text} × ${imageUrl}`, error);
      }
    }

    setEvaluationItems(items);
    setIsSearching(false);

    // 画像を取得
    await loadResultImages(items);
  };

  const loadResultImages = async (items: EvaluationItem[]) => {
    setLoadingImages(true);

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const rankedWithImages = await searchUseCase.getResultImages([item.place]);
          return {
            ...item,
            place: rankedWithImages[0] || item.place,
          };
        } catch (error) {
          console.error(`Failed to load image for ${item.place.name}:`, error);
          return item;
        }
      })
    );

    setEvaluationItems(updatedItems);
    setLoadingImages(false);
  };

  const handleEvaluation = (index: number, evaluation: number) => {
    const newItems = [...evaluationItems];
    newItems[index].evaluation = evaluation;
    setEvaluationItems(newItems);

    // 自動で次へ（スクロールなし）
    if (index < evaluationItems.length - 1) {
      setCurrentIndex(index + 1);
    }
  };

  const moveToNext = () => {
    if (currentIndex < evaluationItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // スクロールは削除
    }
  };

  const moveToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // スクロールは削除
    }
  };

  const calculateNDCG = () => {
    const results: NDCGResult[] = [];

    // テキスト×画像の組み合わせを抽出（ユニークなペア）
    const uniquePairs = new Map<string, { text: string; imageUrl: string }>();
    evaluationItems.forEach(item => {
      // 50:50の結果からユニークなペアを抽出
      if (item.weight === 50) {
        const key = `${item.text}_${item.imageUrl}`;
        if (!uniquePairs.has(key)) {
          uniquePairs.set(key, { text: item.text, imageUrl: item.imageUrl });
        }
      }
    });

    // 各ペアごとにNDCG計算
    uniquePairs.forEach(({ text, imageUrl }, pairKey) => {
      const ndcgByWeight: { [key: number]: number } = {};

      // 各重み（0%, 50%, 100%）でNDCG計算
      [0, 50, 100].forEach(weight => {
        let relevantItems: EvaluationItem[] = [];

        if (weight === 0) {
          // 画像100%：同じ画像URLの結果
          relevantItems = evaluationItems.filter(
            item => item.querySetId === `IMAGE_ONLY_${imageUrl}` && item.weight === 0
          );
        } else if (weight === 50) {
          // 50:50：該当するテキスト×画像の組み合わせ
          relevantItems = evaluationItems.filter(
            item => item.text === text && item.imageUrl === imageUrl && item.weight === 50
          );
        } else if (weight === 100) {
          // テキスト100%：同じテキストの結果
          relevantItems = evaluationItems.filter(
            item => item.querySetId === `TEXT_ONLY_${text}` && item.weight === 100
          );
        }

        // ランクで並び替え
        relevantItems.sort((a, b) => a.rank - b.rank);
        const relevanceScores = relevantItems.map(item => item.evaluation || 0);

        if (relevanceScores.length > 0) {
          // DCG計算
          const dcg = relevanceScores.reduce((sum, rel, i) => {
            return sum + rel / Math.log2(i + 2);
          }, 0);

          // IDCG計算（理想的な順序）
          const idealScores = [...relevanceScores].sort((a, b) => b - a);
          const idcg = idealScores.reduce((sum, rel, i) => {
            return sum + rel / Math.log2(i + 2);
          }, 0);

          // NDCG
          ndcgByWeight[weight] = idcg === 0 ? 0 : dcg / idcg;
        } else {
          ndcgByWeight[weight] = 0;
        }
      });

      // 最高スコアを見つける
      const bestWeight = Object.keys(ndcgByWeight).reduce((best, weight) => {
        const w = Number(weight);
        return ndcgByWeight[w] > ndcgByWeight[Number(best)] ? w : Number(best);
      }, 0);

      results.push({
        querySetId: pairKey,
        text,
        imageUrl,
        weights: ndcgByWeight,
        bestWeight,
        bestNDCG: ndcgByWeight[bestWeight],
      });
    });

    setNdcgResults(results);
  };

  const exportResults = () => {
    const csvContent = [
      ['Text', 'ImageURL', 'Image100%', 'Mix50:50', 'Text100%', 'Average'].join(','),
      ...ndcgResults.map(r => {
        const scores = [r.weights[0] || 0, r.weights[50] || 0, r.weights[100] || 0];
        const rowAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return [
          `"${r.text}"`, // テキストをクォートで囲む
          `"${r.imageUrl}"`, // 画像URLをクォートで囲む
          r.weights[0]?.toFixed(3) || 'N/A',
          r.weights[50]?.toFixed(3) || 'N/A',
          r.weights[100]?.toFixed(3) || 'N/A',
          rowAverage.toFixed(3),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-results-${new Date().toISOString()}.csv`;
    a.click();
  };

  const exportEvaluationData = () => {
    const data = {
      evaluationItems,
      currentIndex,
      exportDate: new Date().toISOString(),
      totalItems: evaluationItems.length,
      evaluatedItems: evaluationItems.filter(item => item.evaluation !== null).length,
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluation-data-${new Date().toISOString()}.json`;
    a.click();
  };

  const getProgress = () => {
    const evaluated = evaluationItems.filter(item => item.evaluation !== null).length;
    return (evaluated / evaluationItems.length) * 100;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">評価システム</h1>

      {!isEvaluating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>検索設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                クエリペア（[テキスト,画像URL] を改行区切り）
              </label>
              <Textarea
                value={queryPairs}
                onChange={e => setQueryPairs(e.target.value)}
                placeholder="テキスト1,https://example.com/image1.jpg&#10;テキスト2,https://example.com/image2.jpg&#10;..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={executeAllSearches}
                disabled={isSearching || !queryPairs.trim()}
                className="flex-1"
              >
                {isSearching ? '検索中...' : '検索実行'}
              </Button>
              <Button
                onClick={() => {
                  if (loadFromLocalStorage()) {
                    alert('LocalStorageから評価データを復元しました');
                  } else {
                    alert('保存されたデータが見つかりません');
                  }
                }}
                variant="outline"
              >
                データ復元
              </Button>
              <Button
                onClick={exportEvaluationData}
                variant="outline"
                disabled={evaluationItems.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                JSON出力
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {evaluationItems.length > 0 && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-lg font-semibold">
                    進捗: {evaluationItems.filter(item => item.evaluation !== null).length} / {evaluationItems.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    現在: #{currentIndex + 1}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsEvaluating(!isEvaluating)}
                    variant={isEvaluating ? 'destructive' : 'default'}
                  >
                    {isEvaluating ? '評価停止' : '評価開始'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (loadFromLocalStorage()) {
                        alert('LocalStorageから評価データを復元しました');
                      } else {
                        alert('保存されたデータが見つかりません');
                      }
                    }}
                    variant="outline"
                  >
                    データ復元
                  </Button>
                  <Button onClick={calculateNDCG} variant="outline">
                    NDCG計算
                  </Button>
                  <Button
                    onClick={() => loadResultImages(evaluationItems)}
                    variant="outline"
                    disabled={loadingImages}
                  >
                    {loadingImages ? '画像読込中...' : '画像再読込'}
                  </Button>
                  <Button onClick={exportResults} variant="outline" disabled={ndcgResults.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV出力
                  </Button>
                  <Button onClick={exportEvaluationData} variant="outline" disabled={evaluationItems.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON出力
                  </Button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {isEvaluating && (
            <div className="space-y-2">
              {evaluationItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${
                    index === currentIndex ? 'ring-2 ring-primary' : ''
                  } ${item.evaluation !== null ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 flex-1">
                      {item.place.imageUrl ? (
                        <img
                          src={item.place.imageUrl}
                          alt={item.place.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">No Image</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          #{item.id} | {item.text.substring(0, 30)}{item.text.length > 30 ? '...' : ''} | T:{item.weight}% I:{100 - item.weight}% | 順位:{item.rank}
                        </p>
                        <p className="font-semibold">{item.place.name}</p>
                        <p className="text-sm text-muted-foreground">{item.place.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map(score => (
                        <Button
                          key={score}
                          onClick={() => handleEvaluation(index, score)}
                          variant={item.evaluation === score ? 'default' : 'outline'}
                          size="sm"
                          className="w-10"
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ndcgResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>NDCG結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* 画像100%の結果を特別表示 */}
                  {ndcgResults.filter(r => r.querySetId === 'IMAGE_ONLY').map(result => (
                    <div key={result.querySetId} className="border-2 border-primary rounded p-3 bg-primary/5">
                      <p className="font-bold text-sm">画像100%（全テキスト共通）</p>
                      <p className="text-lg font-bold text-primary mt-1">
                        NDCG: {result.bestNDCG.toFixed(3)}
                      </p>
                    </div>
                  ))}

                  {/* 各テキストの結果 */}
                  {ndcgResults.filter(r => r.querySetId !== 'IMAGE_ONLY').map(result => (
                    <div key={result.querySetId} className="border rounded p-3">
                      <p className="font-medium text-sm">{result.text.substring(0, 50)}{result.text.length > 50 ? '...' : ''}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className={`text-xs ${result.bestWeight === 0 ? 'font-bold text-primary' : ''}`}>
                          画像100%: {result.weights[0]?.toFixed(3) || 'N/A'}
                        </div>
                        <div className={`text-xs ${result.bestWeight === 50 ? 'font-bold text-primary' : ''}`}>
                          50:50: {result.weights[50]?.toFixed(3) || 'N/A'}
                        </div>
                        <div className={`text-xs ${result.bestWeight === 100 ? 'font-bold text-primary' : ''}`}>
                          テキスト100%: {result.weights[100]?.toFixed(3) || 'N/A'}
                        </div>
                      </div>
                      <p className="text-sm mt-1">
                        最適: {result.bestWeight === 0 ? '画像100%' : result.bestWeight === 50 ? '50:50' : 'テキスト100%'} (NDCG: {result.bestNDCG.toFixed(3)})
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}