from django.test import TestCase
from ai.schemas import (
    MatchingScore, AnimalRecommendation, PersonalityAnalysis, 
    MatchingReport, AIAnimalMatchingResponse
)
from pydantic import ValidationError


class TestAISchemas(TestCase):
    """AI 스키마 테스트 클래스"""

    def test_matching_score_enum(self):
        """매칭 점수 열거형 테스트"""
        self.assertEqual(MatchingScore.VERY_LOW, 1)
        self.assertEqual(MatchingScore.LOW, 2)
        self.assertEqual(MatchingScore.MEDIUM, 3)
        self.assertEqual(MatchingScore.HIGH, 4)
        self.assertEqual(MatchingScore.EXCELLENT, 5)


    def test_animal_recommendation_success(self):
        """동물 추천 스키마 성공 테스트"""
        data = {
            "animal_id": "12345",
            "animal_name": "바둑이",
            "animal_type": "개",
            "breed": "골든 리트리버",
            "age": 24,
            "gender": "수컷",
            "matching_score": 5,
            "matching_reasons": "바둑이는 사용자의 외향적이고 활발한 성격과 매우 잘 맞습니다.",
            "considerations": ["매일 1-2시간 산책 필요", "털 빠짐이 많아 정기적인 그루밍 필요"],
            "care_tips": ["하루 2회 산책 권장", "주 1회 브러싱"],
            "center_name": "서울 동물보호센터",
            "adoption_fee": 150000,
            # 새로 추가된 필드들
            "activity_level": 4,
            "sensitivity": 2,
            "sociability": 5,
            "separation_anxiety": 1,
            "basic_training": 3,
            "description": "친근하고 활발한 골든 리트리버입니다.",
            "personality": "외향적이고 사교적이며 가족과 잘 어울립니다.",
            "health_notes": "건강 상태 양호, 정기 검진 완료",
            "special_needs": "특별한 요구사항 없음"
        }
        
        recommendation = AnimalRecommendation(**data)
        
        # 기본 필드 검증
        self.assertEqual(recommendation.animal_id, "12345")
        self.assertEqual(recommendation.animal_name, "바둑이")
        self.assertEqual(recommendation.matching_score, 5)
        
        # 새로 추가된 levels 필드 검증
        self.assertEqual(recommendation.activity_level, 4)
        self.assertEqual(recommendation.sensitivity, 2)
        self.assertEqual(recommendation.sociability, 5)
        self.assertEqual(recommendation.separation_anxiety, 1)
        self.assertEqual(recommendation.basic_training, 3)
        
        # 새로 추가된 설명 필드 검증
        self.assertEqual(recommendation.description, "친근하고 활발한 골든 리트리버입니다.")
        self.assertEqual(recommendation.personality, "외향적이고 사교적이며 가족과 잘 어울립니다.")
        self.assertEqual(recommendation.health_notes, "건강 상태 양호, 정기 검진 완료")
        self.assertEqual(recommendation.special_needs, "특별한 요구사항 없음")


    def test_animal_recommendation_optional_fields(self):
        """동물 추천 스키마 선택적 필드 테스트"""
        data = {
            "animal_id": "12346",
            "animal_name": "나비",
            "animal_type": "고양이",
            "gender": "암컷",
            "matching_score": 4,
            "matching_reasons": "나비는 조용하고 독립적인 성격으로 바쁜 직장인에게 적합합니다.",
            "considerations": ["독립적인 성격", "높은 곳을 좋아함"],
            "care_tips": ["높은 캣타워 제공", "정기적인 그루밍"],
            # 선택적 필드들은 None으로 설정 가능
            "breed": None,
            "age": None,
            "center_name": None,
            "adoption_fee": None,
            "activity_level": None,
            "sensitivity": None,
            "sociability": None,
            "separation_anxiety": None,
            "basic_training": None,
            "description": None,
            "personality": None,
            "health_notes": None,
            "special_needs": None
        }
        
        recommendation = AnimalRecommendation(**data)
        
        # 필수 필드 검증
        self.assertEqual(recommendation.animal_id, "12346")
        self.assertEqual(recommendation.animal_name, "나비")
        
        # 선택적 필드 검증
        self.assertIsNone(recommendation.breed)
        self.assertIsNone(recommendation.age)
        self.assertIsNone(recommendation.activity_level)
        self.assertIsNone(recommendation.description)


    def test_animal_recommendation_validation_error(self):
        """동물 추천 스키마 검증 오류 테스트"""
        # 필수 필드 누락
        with self.assertRaises(ValidationError):
            AnimalRecommendation(
                animal_name="바둑이",  # animal_id 누락
                animal_type="개",
                gender="수컷",
                matching_score=5,
                matching_reasons="테스트",
                considerations=[],
                care_tips=[]
            )
        
        # 잘못된 매칭 점수
        with self.assertRaises(ValidationError):
            AnimalRecommendation(
                animal_id="12345",
                animal_name="바둑이",
                animal_type="개",
                gender="수컷",
                matching_score=6,  # 1-5 범위 초과
                matching_reasons="테스트",
                considerations=[],
                care_tips=[]
            )


    def test_personality_analysis_success(self):
        """성격 분석 스키마 성공 테스트"""
        data = {
            "user_personality_type": "외향적이고 활동적인 성격",
            "key_traits": ["활발함", "사교적", "책임감 강함"],
            "lifestyle_match": "활동적인 라이프스타일에 적합",
            "experience_level": "중급자",
            "recommendations_summary": "에너지가 높고 사교적인 동물들을 추천합니다"
        }
        
        analysis = PersonalityAnalysis(**data)
        
        self.assertEqual(analysis.user_personality_type, "외향적이고 활동적인 성격")
        self.assertEqual(len(analysis.key_traits), 3)
        self.assertEqual(analysis.experience_level, "중급자")


    def test_matching_report_success(self):
        """매칭 결과 보고서 스키마 성공 테스트"""
        data = {
            "total_analyzed_animals": 25,
            "recommended_count": 3,
            "analysis_criteria": ["성격 매칭", "활동 수준", "사회성", "케어 난이도"],
            "matching_algorithm": "AI 기반 성격-동물 특성 매칭",
            "confidence_level": "높음",
            "generated_at": "2024-01-20T15:30:00Z"
        }
        
        report = MatchingReport(**data)
        
        self.assertEqual(report.total_analyzed_animals, 25)
        self.assertEqual(report.recommended_count, 3)
        self.assertEqual(len(report.analysis_criteria), 4)


    def test_ai_animal_matching_response_success(self):
        """AI 동물 매칭 최종 응답 스키마 성공 테스트"""
        # 하위 스키마들 생성
        personality_analysis = PersonalityAnalysis(
            user_personality_type="외향적이고 활동적인 성격",
            key_traits=["활발함", "사교적"],
            lifestyle_match="활동적인 라이프스타일에 적합",
            experience_level="중급자",
            recommendations_summary="에너지가 높고 사교적인 동물들을 추천합니다"
        )
        
        matching_report = MatchingReport(
            total_analyzed_animals=25,
            recommended_count=3,
            analysis_criteria=["성격 매칭", "활동 수준"],
            matching_algorithm="AI 기반 성격-동물 특성 매칭",
            confidence_level="높음",
            generated_at="2024-01-20T15:30:00Z"
        )
        
        animal_recommendation = AnimalRecommendation(
            animal_id="12345",
            animal_name="바둑이",
            animal_type="개",
            gender="수컷",
            matching_score=5,
            matching_reasons="테스트",
            considerations=["테스트"],
            care_tips=["테스트"],
            activity_level=4,
            sensitivity=2,
            sociability=5,
            separation_anxiety=1,
            basic_training=3,
            description="테스트",
            personality="테스트",
            health_notes="테스트",
            special_needs="테스트"
        )
        
        # 최종 응답 생성
        response = AIAnimalMatchingResponse(
            analysis_reason=personality_analysis,
            matching_report=matching_report,
            animal_recommendations=[animal_recommendation]
        )
        
        # 검증
        self.assertEqual(response.analysis_reason.user_personality_type, "외향적이고 활동적인 성격")
        self.assertEqual(response.matching_report.total_analyzed_animals, 25)
        self.assertEqual(len(response.animal_recommendations), 1)
        self.assertEqual(response.animal_recommendations[0].animal_name, "바둑이")
