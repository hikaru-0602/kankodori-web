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
}

const DEFAULT_VALUE = 50;

export function SimilarityWeightSlider({
  onWeightChange,
  disabled = false,
}: SimilarityWeightSliderProps) {
  const [imagePercentage, setImagePercentage] = useState(DEFAULT_VALUE);

  const handleSliderChange = (value: number[]) => {
    const newImagePercentage = value[0];
    setImagePercentage(newImagePercentage);

    const textPercentage = 100 - newImagePercentage;
    const weight = createSimilarityWeight(textPercentage);
    onWeightChange(weight);
  };

  useEffect(() => {
    const textPercentage = 100 - DEFAULT_VALUE;
    const initialWeight = createSimilarityWeight(textPercentage);
    onWeightChange(initialWeight);
  }, []);

  const textPercentage = 100 - imagePercentage;

  return (
    <Card className="w-full border-0 bg-card/50 backdrop-blur overflow-hidden">
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
                step={20}
                disabled={disabled}
                className="w-full touch-pan-y"
              />

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
            <div className="flex justify-between px-4 text-xs sm:text-sm">
              <span className="text-muted-foreground">テキスト{textPercentage}%</span>
              <span className="text-muted-foreground">画像{imagePercentage}%</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
