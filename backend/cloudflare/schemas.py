from ninja import Schema
from typing import Optional
from datetime import datetime


class FileUploadIn(Schema):
    """파일 업로드 입력 스키마"""
    file: bytes
    filename: str
    content_type: Optional[str] = "application/octet-stream"
    folder: Optional[str] = "uploads"  # 폴더 경로 지정 가능


class FileUploadOut(Schema):
    """파일 업로드 출력 스키마"""
    success: bool
    message: str
    file_url: Optional[str] = None
    file_key: Optional[str] = None
    uploaded_at: Optional[datetime] = None


class FileDeleteIn(Schema):
    """파일 삭제 입력 스키마"""
    file_key: str


class FileDeleteOut(Schema):
    """파일 삭제 출력 스키마"""
    success: bool
    message: str
    deleted_at: Optional[datetime] = None


class FileInfoOut(Schema):
    """파일 정보 출력 스키마"""
    file_key: str
    file_url: str
    content_type: str
    size: Optional[int] = None
    uploaded_at: Optional[datetime] = None
