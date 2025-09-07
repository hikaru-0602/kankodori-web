import type {
  SearchRequest,
  SearchResult,
  SimilarityWeight,
  SuggestedImage,
} from '@/domain/types/SearchTypes';
import type { PlaceWithScore } from '@/domain/entities/Place';
import { PlaceEntity } from '@/domain/entities/Place';

export interface SearchRepository {
  search(request: SearchRequest): Promise<SearchResult>;
  getSuggestedImages(): Promise<SuggestedImage[]>;
}

export interface ImageStorageService {
  getImageUrl(directory: string, filename: string): Promise<string>;
}

export class SearchUseCase {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly imageStorageService: ImageStorageService
  ) {}

  async search(request: SearchRequest): Promise<SearchResult> {
    return await this.searchRepository.search(request);
  }

  async getSuggestedImages(): Promise<SuggestedImage[]> {
    const images = await this.searchRepository.getSuggestedImages();

    // 画像URLを取得して付与
    const imagesWithUrls = await Promise.all(
      images.map(async image => ({
        ...image,
        url: await this.imageStorageService.getImageUrl('api/query_image', image.filename),
      }))
    );

    return imagesWithUrls;
  }

  calculateRankedResults(
    searchResult: SearchResult,
    similarityWeight: SimilarityWeight,
    topCount: number = 10
  ): PlaceWithScore[] {
    const placesWithScores = searchResult.places.map(place => {
      const placeEntity = new PlaceEntity(
        place.id,
        place.name,
        place.location,
        place.textSimilarity,
        place.imageSimilarity
      );

      return placeEntity.calculateCombinedScore(
        similarityWeight.textWeight,
        similarityWeight.imageWeight
      );
    });

    // スコア順にソート（降順）
    const sortedPlaces = placesWithScores.sort((a, b) => b.combinedScore - a.combinedScore);
    
    // place.nameで重複除去（より高いスコアのものを残す）
    const uniquePlaces: PlaceWithScore[] = [];
    const seenNames = new Set<string>();
    
    for (const place of sortedPlaces) {
      if (!seenNames.has(place.name)) {
        seenNames.add(place.name);
        uniquePlaces.push(place);
        
        // 上位件数に達したら終了
        if (uniquePlaces.length >= topCount) {
          break;
        }
      }
    }
    
    return uniquePlaces;
  }

  async getResultImages(places: PlaceWithScore[]): Promise<PlaceWithScore[]> {
    return await Promise.all(
      places.map(async place => ({
        ...place,
        imageUrl: await this.imageStorageService.getImageUrl('api/photo', `${place.id}.jpg`),
      }))
    );
  }
}
