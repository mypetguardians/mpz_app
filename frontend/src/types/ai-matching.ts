export interface AIRecommendRequest {
  user_id: string;
  preferences: Record<string, string | number | boolean>;
  limit: number;
}

export interface AIMatchingPreferences {
  activity: string;
  age: string;
  custom: string;
  experience: string;
  gender: string;
  sensitivity: string;
  size: string;
  space: string;
  time: string;
}

export interface AIMatchingMeta {
  agent_used: string;
  api_version: string;
  generated_at: string;
  model_used: string;
  preferences: AIMatchingPreferences;
  request_limit: number;
  user_id: string;
}

export interface AIRecommendResponse {
  success: boolean;
  data: {
    analysis_reason: {
      user_personality_type: string;
      lifestyle_match: string;
      experience_level: string;
      key_traits: string[];
      recommendations_summary: string;
    };
    animal_recommendations: Array<{
      adoption_fee: number;
      animal_id: string;
      animal_name: string;
      animal_type: string;
      breed: string;
      age: string | number;
      gender?: string;
      care_tips: string[];
      considerations: string[];
      found_location: string;
      center_name: string;
      matching_reason: string;
      matching_score: number;
    }>;
    matching_report: {
      analysis_criteria: string[];
      confidence_level: string;
      generated_at: string;
      matching_algorithm: string;
      recommended_count: number;
      total_analyzed_animals: number;
    };
  };
  meta: AIMatchingMeta;
}
