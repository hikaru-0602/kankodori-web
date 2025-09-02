import apiClient from "./api-client";

export const searchService = {
  async searchPlaces(params: { text?: string; image?: File }) {
    const formData = new FormData();

    if (params.text) {
      formData.append("text", params.text);
    }

    if (params.image) {
      formData.append("image", params.image);
    }

    const { data, error } = await apiClient.POST("/search", {
      body: formData,
    });

    if (error) {
      throw new Error("検索に失敗しました");
    }

    return data;
  },

  async getSuggestedImages() {
    const { data, error } = await apiClient.GET("/suggest-images");

    if (error) {
      throw new Error("画像提案の取得に失敗しました");
    }

    return data;
  },
};
