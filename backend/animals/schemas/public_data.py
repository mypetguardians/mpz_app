from ninja import Schema, Field
from typing import List, Optional
from datetime import date, datetime


class PublicDataSyncIn(Schema):
    """공공데이터 동기화 입력 스키마"""
    bgnde: str = Field(..., description="구조날짜 시작 (YYYYMMDD)")
    endde: str = Field(..., description="구조날짜 종료 (YYYYMMDD)")
    upkind: str = Field("417000", description="축종코드 (개: 417000, 고양이: 422400, 기타: 429900)")
    state: Optional[str] = Field(None, description="상태 (notice: 공고중, protect: 보호중)")
    page_no: int = Field(1, description="페이지 번호")
    num_of_rows: int = Field(1000, description="페이지당 보여줄 개수")


class PublicDataAnimalOut(Schema):
    """공공데이터 동물 출력 스키마"""
    desertion_no: str = Field(..., description="유기번호")
    happen_dt: Optional[date] = Field(None, description="구조날짜")
    happen_place: str = Field(..., description="발견장소")
    kind_full_nm: str = Field(..., description="품종 전체명")
    up_kind_cd: str = Field(..., description="축종코드")
    up_kind_nm: str = Field(..., description="축종명")
    kind_cd: str = Field(..., description="품종코드")
    kind_nm: str = Field(..., description="품종명")
    color_cd: str = Field(..., description="색상")
    age: str = Field(..., description="나이")
    weight: str = Field(..., description="체중")
    notice_no: str = Field(..., description="공고번호")
    notice_sdt: Optional[date] = Field(None, description="공고시작일")
    notice_edt: Optional[date] = Field(None, description="공고종료일")
    popfile1: Optional[str] = Field(None, description="이미지1")
    popfile2: Optional[str] = Field(None, description="이미지2")
    process_state: str = Field(..., description="처리상태")
    sex_cd: str = Field(..., description="성별")
    neuter_yn: str = Field(..., description="중성화여부")
    special_mark: str = Field(..., description="특이사항")
    notice_comment: Optional[str] = Field(None, description="공고 코멘트")
    care_reg_no: str = Field(..., description="보호소번호")
    care_nm: str = Field(..., description="보호소명")
    care_tel: str = Field(..., description="보호소연락처")
    care_addr: str = Field(..., description="보호소주소")
    care_owner_nm: str = Field(..., description="보호소소유자명")
    org_nm: str = Field(..., description="기관명")
    upd_tm: Optional[datetime] = Field(None, description="수정시간")


class PublicDataSyncResultOut(Schema):
    """공공데이터 동기화 결과 출력 스키마"""
    created: int = Field(..., description="생성된 동물 수")
    updated: int = Field(..., description="업데이트된 동물 수")
    errors: int = Field(..., description="오류 발생 수")
    total: int = Field(..., description="총 처리된 동물 수")


class PublicDataSyncResponseOut(Schema):
    """공공데이터 동기화 응답 스키마"""
    message: str = Field(..., description="응답 메시지")
    result: PublicDataSyncResultOut = Field(..., description="동기화 결과")


class PublicDataStatusOut(Schema):
    """공공데이터 상태 출력 스키마"""
    total_public_animals: int = Field(..., description="전체 공공데이터 동물 수")
    protection_status_distribution: List[dict] = Field(..., description="보호상태별 분포")
    adoption_status_distribution: List[dict] = Field(..., description="입양상태별 분포")
    latest_update: Optional[str] = Field(None, description="최근 업데이트 시간")


class PublicDataErrorOut(Schema):
    """공공데이터 오류 출력 스키마"""
    error: str = Field(..., description="오류 메시지")
    detail: Optional[str] = Field(None, description="상세 오류 정보")
