import os
import logging
import boto3
from botocore.client import Config

logger = logging.getLogger(__name__)


class R2Client:
    """
    Cloudflare R2 클라이언트 (boto3 S3 compatible)
    환경변수에서 R2 자격증명 및 버킷 정보를 읽어 초기화합니다.
    """
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY")
        self.secret_key = os.getenv("R2_SECRET_KEY")
        self.bucket = os.getenv("R2_BUCKET")
        self.endpoint = os.getenv("R2_ENDPOINT")
        self.public_base_url = os.getenv("R2_PUBLIC_BASE_URL")
        if not all([self.account_id, self.access_key, self.secret_key, self.bucket, self.endpoint, self.public_base_url]):
            raise ValueError("R2 환경변수(R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL)가 모두 필요합니다.")
        self.client = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.endpoint,
            config=Config(signature_version="s3v4"),
            region_name="auto"  # R2는 region이 "auto"로 동작
        )

    def upload_file(self, key: str, data: bytes, content_type: str = "application/octet-stream"):
        """R2 버킷에 파일 업로드 (boto3)"""
        try:
            response = self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type
            )
            logger.info(f"R2 업로드 성공: {key}")
            return response
        except Exception as e:
            logger.error(f"R2 업로드 실패: {key}, 오류: {e}")
            raise

    def download_file(self, key: str):
        """R2 버킷에서 파일 다운로드 (boto3)"""
        try:
            response = self.client.get_object(
                Bucket=self.bucket,
                Key=key
            )
            logger.info(f"R2 다운로드 성공: {key}")
            return response["Body"].read()
        except Exception as e:
            logger.error(f"R2 다운로드 실패: {key}, 오류: {e}")
            raise

    def delete_file(self, key: str):
        """R2 버킷에서 파일 삭제 (boto3)"""
        try:
            response = self.client.delete_object(
                Bucket=self.bucket,
                Key=key
            )
            logger.info(f"R2 삭제 성공: {key}")
            return response
        except Exception as e:
            logger.error(f"R2 삭제 실패: {key}, 오류: {e}")
            raise
