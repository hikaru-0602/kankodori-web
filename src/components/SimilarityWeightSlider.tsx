'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { SimilarityWeight } from '@/domain/types/SearchTypes';
import { createSimilarityWeight } from '@/domain/types/SearchTypes';

interface SimilarityWeightSliderProps {
  onWeightChange: (weight: SimilarityWeight) => void;
  disabled?: boolean;
}

const WEIGHT_OPTIONS = [10, 30, 50, 70, 90, 100];
const DEFAULT_VALUE = 50;

export function SimilarityWeightSlider({ onWeightChange, disabled = false }: SimilarityWeightSliderProps) {
  const [textPercentage, setTextPercentage] = useState(DEFAULT_VALUE);

  const handleSliderChange = (value: number[]) => {
    const newTextPercentage = value[0];
    setTextPercentage(newTextPercentage);
    
    const weight = createSimilarityWeight(newTextPercentage);
    onWeightChange(weight);
  };

  // 初期値を設定（一度だけ実行）
  useEffect(() => {
    const initialWeight = createSimilarityWeight(DEFAULT_VALUE);
    onWeightChange(initialWeight);
  }, []); // 依存配列を空にして一度だけ実行

  const imagePercentage = 100 - textPercentage;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          類似度の重み調整
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>画像重視</span>
            <span>テキスト重視</span>
          </div>
          
          <div className="px-2">
            <Slider
              value={[textPercentage]}
              onValueChange={handleSliderChange}
              min={10}
              max={100}
              step={20}
              disabled={disabled}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            {WEIGHT_OPTIONS.map((value) => (
              <span key={value} className="text-center min-w-[2rem]">
                {value}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-sm font-medium text-secondary-foreground">
              画像類似度
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {imagePercentage}%
            </div>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-sm font-medium text-secondary-foreground">
              テキスト類似度
            </div>
            <div className="text-2xl font-bold text-green-600">
              {textPercentage}%
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground text-center">
          検索結果の類似度スコアを上記の割合で組み合わせて表示します
        </div>
      </CardContent>
    </Card>
  );
}