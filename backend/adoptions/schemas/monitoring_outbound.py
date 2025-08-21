from ninja import Schema
from typing import List, Optional, Dict, Any


class MonitoringProgressOut(Schema):
    """모니터링 진행률 정보"""
    percentage: int = 0
    description: str = ""


class CenterConfigOut(Schema):
    """센터 모니터링 설정 정보"""
    monitoring_period_months: int = 3
    monitoring_interval_days: int = 14


class MonitoringCheckPeriodOut(Schema):
    """모니터링 체크 기간 정보"""
    start: str
    end: str


class RecentCheckOut(Schema):
    """최근 모니터링 체크 정보"""
    check_sequence: int
    check_date: str
    expected_check_date: str
    period: MonitoringCheckPeriodOut
    posts_found: int
    status: str
    delay_days: int
    days_until_deadline: int
    notes: Optional[str] = None


class MonitoringStatusOut(Schema):
    """모니터링 상태 정보"""
    adoption_id: str
    status: str
    monitoring_status: Optional[str] = None
    monitoring_started_at: Optional[str] = None
    monitoring_end_date: Optional[str] = None
    next_check_date: Optional[str] = None
    days_until_next_deadline: Optional[int] = None
    days_until_monitoring_end: Optional[int] = None
    completed_checks: int = 0
    total_checks: int = 0
    total_monitoring_posts: int = 0
    monitoring_progress: MonitoringProgressOut
    center_config: CenterConfigOut
    recent_checks: List[RecentCheckOut] = []


class MonitoringCheckOut(Schema):
    """모니터링 체크 기록 정보"""
    id: str
    adoption_id: str
    check_sequence: int
    check_date: str
    expected_check_date: str
    period_start: str
    period_end: str
    posts_found: int
    status: str
    delay_days: int
    days_until_deadline: int
    next_check_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class MonitoringSummaryOut(Schema):
    """모니터링 요약 정보"""
    total_adoptions: int = 0
    total_checks: int = 0
    completed_checks: int = 0
    overall_progress: int = 0
    delayed_adoptions: int = 0
    upcoming_deadlines: int = 0
    summary_date: str
