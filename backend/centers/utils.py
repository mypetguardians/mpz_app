"""센터 관련 유틸리티 함수"""

# 두 글자 지역명과 전체 이름 간 변환 매핑
REGION_MAPPING = {
    # 두 글자 -> 전체 이름
    "충북": ["충청북도"],
    "충남": ["충청남도"],
    "전북": ["전라북도", "전북특별자치도"],
    "전남": ["전라남도"],
    "경북": ["경상북도"],
    "경남": ["경상남도"],
    # 전체 이름 -> 두 글자
    "충청북도": "충북",
    "충청남도": "충남",
    "전라북도": "전북",
    "전북특별자치도": "전북",
    "전라남도": "전남",
    "경상북도": "경북",
    "경상남도": "경남",
}


def get_region_search_variants(region: str):
    """
    지역명의 모든 변형(두 글자 + 전체 이름)을 반환합니다.
    검색 시 두 형식 모두 매칭되도록 사용합니다.
    
    Args:
        region: 지역명 (예: "충북" 또는 "충청북도")
    
    Returns:
        list: 지역명의 모든 변형 리스트
    """
    if not region:
        return []
    
    variants = [region]
    
    # 두 글자 -> 전체 이름 변환
    if region in REGION_MAPPING:
        if isinstance(REGION_MAPPING[region], list):
            variants.extend(REGION_MAPPING[region])
        else:
            variants.append(REGION_MAPPING[region])
    
    # 전체 이름 -> 두 글자 변환
    for key, value in REGION_MAPPING.items():
        if isinstance(value, list):
            if region in value:
                if key not in variants:
                    variants.append(key)
        elif region == value:
            if key not in variants:
                variants.append(key)
    
    # 중복 제거
    return list(set(variants))

