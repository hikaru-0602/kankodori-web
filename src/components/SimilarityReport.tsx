import React from 'react';
import { PlaceWithScore } from '@/domain/entities/Place';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SimilarityReportProps {
  results: PlaceWithScore[];
}

interface Statistics {
  max: number;
  min: number;
  average: number;
  median: number;
  distribution: { range: string; count: number }[];
}

export const SimilarityReport: React.FC<SimilarityReportProps> = ({ results }) => {
  const calculateStatistics = (values: number[]): Statistics => {
    if (values.length === 0) {
      return {
        max: 0,
        min: 0,
        average: 0,
        median: 0,
        distribution: []
      };
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    // Create distribution bins (0-0.1, 0.1-0.2, ..., 0.9-1.0)
    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${(i * 0.1).toFixed(1)}-${((i + 1) * 0.1).toFixed(1)}`,
      count: 0
    }));

    values.forEach(value => {
      const binIndex = Math.min(Math.floor(value * 10), 9);
      bins[binIndex].count++;
    });

    return {
      max,
      min,
      average,
      median,
      distribution: bins
    };
  };

  const textSimilarities = results.map(r => r.textSimilarity);
  const imageSimilarities = results.map(r => r.imageSimilarity);

  const textStats = calculateStatistics(textSimilarities);
  const imageStats = calculateStatistics(imageSimilarities);

  const StatisticsCard = ({ title, stats }: { title: string; stats: Statistics }) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">最大値</p>
            <p className="text-xl font-semibold">{stats.max.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">最小値</p>
            <p className="text-xl font-semibold">{stats.min.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">平均値</p>
            <p className="text-xl font-semibold">{stats.average.toFixed(3)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">中央値</p>
            <p className="text-xl font-semibold">{stats.median.toFixed(3)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">範囲（最大値 - 最小値）</p>
            <p className="text-xl font-semibold">{(stats.max - stats.min).toFixed(3)}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">分布</p>
          <div className="space-y-2">
            {stats.distribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">{item.range}</span>
                <div className="flex-1 bg-muted rounded-sm h-6 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary/70 transition-all"
                    style={{ width: `${(item.count / Math.max(...stats.distribution.map(d => d.count))) * 100}%` }}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6 mt-8">
      <h2 className="text-2xl font-bold">類似度レポート</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatisticsCard title="テキスト類似度" stats={textStats} />
        <StatisticsCard title="画像類似度" stats={imageStats} />
      </div>
    </div>
  );
};