'use client';

import { Card } from './ui/card';

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted animate-pulse rounded-md w-32"></div>
        <div className="h-6 bg-muted animate-pulse rounded-full w-12"></div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-0 bg-card/50 backdrop-blur">
            <div className="flex">
              {/* Image Skeleton */}
              <div className="w-32 sm:w-40 h-24 sm:h-32 flex-shrink-0 bg-muted animate-pulse relative">
                {/* Ranking Badge Skeleton */}
                <div className="absolute top-1 left-1">
                  <div className="h-6 w-8 bg-background/80 animate-pulse rounded-full"></div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="flex-1 p-3 sm:p-4 space-y-2">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-muted animate-pulse rounded-md w-3/4"></div>
                    </div>
                    <div className="ml-2 h-6 w-12 bg-muted animate-pulse rounded-full"></div>
                  </div>

                  <div className="h-4 bg-muted animate-pulse rounded-md w-1/2"></div>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="h-4 bg-muted animate-pulse rounded-md w-16"></div>
                  <div className="h-4 bg-muted animate-pulse rounded-md w-20"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
