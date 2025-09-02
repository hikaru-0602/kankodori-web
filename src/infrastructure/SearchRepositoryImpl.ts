import apiClient from "@/lib/api-client";
import type { SearchRepository } from "@/usecase/SearchUseCase";
import type {
  SearchRequest,
  SearchResult,
  SuggestedImage,
} from "@/domain/types/SearchTypes";
import { PlaceEntity } from "@/domain/entities/Place";

export class SearchRepositoryImpl implements SearchRepository {
  async search(request: SearchRequest): Promise<SearchResult> {
    const formData = new FormData();

    if (request.text) {
      formData.append("text", request.text);
    }

    if (request.image) {
      formData.append("image", request.image);
    }

    const response = await apiClient.POST("/search", {
      body: formData as unknown as { "multipart/form-data": unknown },
    });

    if (!response.data) {
      throw new Error("Search failed: No data received from API");
    }

    const places = response.data.results.map(
      (result) =>
        new PlaceEntity(
          result.id,
          result.name,
          result.location,
          result.text_similarity,
          result.image_similarity
        )
    );

    return {
      places,
      metadata: {
        actualText: response.data.metadata.actual_text,
        textGenerated: response.data.metadata.text_generated,
        imageGenerated: response.data.metadata.image_generated,
        hasImage: response.data.metadata.has_image,
        originalText: response.data.metadata.original_text,
        hasOriginalImage: response.data.metadata.has_original_image,
      },
    };
  }

  async getSuggestedImages(): Promise<SuggestedImage[]> {
    const response = await apiClient.GET("/suggest-images");

    if (!response.data) {
      throw new Error("Failed to get suggested images: No data received");
    }

    return response.data.suggested_images.map((filename) => ({
      filename,
    }));
  }
}
