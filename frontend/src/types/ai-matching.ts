export interface AIRecommendRequest {
  user_id: string;
  preferences: Record<string, string | number | boolean>;
  limit: number;
}

export interface AIRecommendResponse {
  recommendations: Array<{
    animal_id: string;
    animal_name: string;
    center_name: string;
    match_score: number;
    reason: string;
  }>;
  total_count: number;
}
