from django.conf import settings
from langchain_openai import ChatOpenAI
import os

def get_openai_api_key():
    """OpenAI API 키를 가져옵니다."""
    return settings.OPENAI_API_KEY


def get_openai_model(model="gpt-5-nano"):
    """OpenAI 모델을 가져옵니다."""
    if model is None:
        model = "gpt-5-nano"  
    
    # LangSmith 추적 설정
    if getattr(settings, 'LANGCHAIN_TRACING_V2', False):
        # 환경 변수가 이미 settings.py에서 설정되므로 추가 설정 불필요
        pass
    
    return ChatOpenAI(
        model=model,
        temperature=0.7,  # 창의적인 매칭을 위해 약간의 변동성 추가
        max_retries=2,
        max_tokens=20000,  # 충분한 응답 길이 보장 (기본값: ~1024)
        api_key=get_openai_api_key(), 
    )
