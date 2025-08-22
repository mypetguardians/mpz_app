from langgraph.prebuilt import create_react_agent
from langchain_core.output_parsers import PydanticOutputParser

from ai.llms import get_openai_model
from ai.tools import animal_matching_tools
from ai.schemas import AIAnimalMatchingResponse
from ai.prompts import ANIMAL_MATCHING_SYSTEM_PROMPT


def get_animal_matching_agent(model=None, checkpointer=None):
    """
    동물 매칭 에이전트를 생성합니다.
    사용자의 성격 테스트 결과를 기반으로 적합한 동물을 추천합니다.
    """
    llm_model = get_openai_model(model=model)
    
    # Pydantic Parser 설정
    parser = PydanticOutputParser(pydantic_object=AIAnimalMatchingResponse)
    format_instructions = parser.get_format_instructions()

    # 프롬프트에 format_instructions 추가
    system_prompt = ANIMAL_MATCHING_SYSTEM_PROMPT.format(format_instructions=format_instructions)

    agent = create_react_agent(
        model=llm_model,  
        tools=animal_matching_tools,  
        prompt=system_prompt,
        checkpointer=checkpointer,
        name="animal-matching-assistant"
    )
    return agent
