'use client';

import { Card } from './ui/card';

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted animate-pulse rounded-md w-32"></div>
        <div className="h-6 bg-muted animate-pulse rounded-full w-12"></div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden border-0 bg-card/50 backdrop-blur">
            {/* Image Skeleton */}
            <div className="relative aspect-[4/3] bg-muted animate-pulse"></div>
            
            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="h-6 bg-muted animate-pulse rounded-md w-3/4"></div>
                <div className="h-4 bg-muted animate-pulse rounded-md w-1/2"></div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded-md w-full"></div>
                <div className="h-4 bg-muted animate-pulse rounded-md w-2/3"></div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 bg-muted animate-pulse rounded-full w-16"></div>
                <div className="h-5 bg-muted animate-pulse rounded-full w-20"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}