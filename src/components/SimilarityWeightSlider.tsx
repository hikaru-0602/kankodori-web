'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Type } from 'lucide-react';
import type { SimilarityWeight } from '@/domain/types/SearchTypes';
import { createSimilarityWeight } from '@/domain/types/SearchTypes';

interface SimilarityWeightSliderProps {
  onWeightChange: (weight: SimilarityWeight) => void;
  disabled?: boolean;
  reset?: boolean;
}

const DEFAULT_VALUE = 50;
const SNAP_VALUES = [0, 25, 50, 75, 100];

export function SimilarityWeightSlider({
  onWeightChange,
  disabled = false,
  reset = false,
}: SimilarityWeightSliderProps) {
  const [imagePercentage, setImagePercentage] = useState(DEFAULT_VALUE);

  const handleSliderChange = (value: number[]) => {
    const rawValue = value[0];
    // 最も近いスナップ値を見つける
    const snappedValue = SNAP_VALUES.reduce((prev, curr) =>
      Math.abs(curr - rawValue) < Math.abs(prev - rawValue) ? curr : prev
    );

    setImagePercentage(snappedValue);

    const textPercentage = 100 - snappedValue;
    const weight = createSimilarityWeight(textPercentage);
    onWeightChange(weight);
  };

  useEffect(() => {
    setImagePercentage(DEFAULT_VALUE);
    const textPercentage = 100 - DEFAULT_VALUE;
    const initialWeight = createSimilarityWeight(textPercentage);
    onWeightChange(initialWeight);
  }, [reset]);

  const textPercentage = 100 - imagePercentage;

  return (
    <Card className="w-full border-0 shadow-none bg-card/50 backdrop-blur overflow-hidden">
      <div className="p-4 sm:p-6">
        <CardContent className="p-0 space-y-6">
          {/* Mobile-Optimized Slider */}
          <div className="space-y-4">
            <div className="relative px-8">
              <Slider
                value={[imagePercentage]}
                onValueChange={handleSliderChange}
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                className="w-full touch-pan-y"
              />

              {/* メモリ線（目盛り） */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none">
                {SNAP_VALUES.map(value => (
                  <div
                    key={value}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${value}%` }}
                  >
                    <div className="w-px h-3 bg-white" />
                  </div>
                ))}
              </div>

              {/* Visual Indicators */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="flex items-center justify-center w-8 h-8 rounded-full">
                  <Type className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="flex items-center justify-center w-8 h-8 rounded-full">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
            {/* Labels for Mobile */}
            <div className="flex justify-between px-4 text-sm sm:text-base font-medium mt-8">
              <span className="text-muted-foreground">テキスト {textPercentage}%</span>
              <span className="text-muted-foreground">画像 {imagePercentage}%</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
