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

// 사용자의 AI 성격 테스트 정보를 반환하는 타입
export interface UserAIPersonalityTestInfo {
  success: boolean;
  tests: Array<{
    completed_at: string;
    test_id: string;
    test_name: string;
    test_type: string;
    total_questions: number;
  }>;
  total_tests: number;
  user_id: string;
}

// AI 성격 테스트 결과를 반환하는 타입
export interface AIPersonalityTestResult {
  success: boolean;
  completed_at: string;
  result: {
    agent_used: string;
    ai_recommendation: {
      analysis_reason: {
        experience_level: string;
        key_traits: string[];
        lifestyle_match: string;
        recommendations_summary: string;
        user_personality_type: string;
      };
      animal_recommendations: Array<{
        age: number;
        breed: string;
        gender: string;
        animal_id: string;
        care_tips: string[];
        considerations: string[];
        found_location: string;
        center_name: string;
        matching_reason: string;
        matching_score: number;
        adoption_fee?: number;
        animal_name?: string;
        animal_type?: string;
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
    limit: number;
    model_used: string;
    preferences: Record<string, string>;
    recommendation_date: string;
    success: boolean;
    test_data: Record<string, string>;
    test_type: string;
    user_id: string;
  };
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
