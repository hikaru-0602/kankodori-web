export interface Place {
  id: string;
  name: string;
  location: string;
  textSimilarity: number;
  imageSimilarity: number;
}

export interface PlaceWithScore extends Place {
  combinedScore: number;
}

export class PlaceEntity implements Place {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly location: string,
    public readonly textSimilarity: number,
    public readonly imageSimilarity: number
  ) {}

  calculateCombinedScore(textWeight: number, imageWeight: number): PlaceWithScore {
    const combinedScore = (this.textSimilarity * textWeight) + (this.imageSimilarity * imageWeight);
    
    return {
      id: this.id,
      name: this.name,
      location: this.location,
      textSimilarity: this.textSimilarity,
      imageSimilarity: this.imageSimilarity,
      combinedScore
    };
  }
}