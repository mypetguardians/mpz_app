from django.conf import settings
from langchain_openai import ChatOpenAI


def get_openai_api_key():
    """OpenAI API 키를 가져옵니다."""
    return settings.OPENAI_API_KEY


def get_openai_model(model="gpt-5-nano"):
    """OpenAI 모델을 가져옵니다."""
    if model is None:
        model = "gpt-5-nano"
    return ChatOpenAI(
        model=model,
        temperature=0.7,  # 창의적인 매칭을 위해 약간의 변동성 추가
        max_retries=2,
        api_key=get_openai_api_key(), 
    )
