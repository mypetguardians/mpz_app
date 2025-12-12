# Firebase Admin SDK 초기화
import os
import json
import logging
from pathlib import Path
from decouple import config

logger = logging.getLogger(__name__)

# Firebase Admin SDK 초기화
_firebase_initialized = False

def initialize_firebase():
    """Firebase Admin SDK를 초기화합니다."""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    try:
        import firebase_admin
        from firebase_admin import credentials
        
        # Firebase 서비스 계정 파일 경로 확인
        firebase_credentials_path = config(
            'FIREBASE_ADMIN_CREDENTIALS_PATH',
            default=None
        )
        
        # 환경변수로 직접 JSON 제공하는 경우
        firebase_credentials_json = config('FIREBASE_ADMIN_CREDENTIALS_JSON', default=None)
        
        if firebase_credentials_json:
            # JSON 문자열을 파싱하여 사용
            try:
                cred_dict = json.loads(firebase_credentials_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK가 JSON 환경변수로 초기화되었습니다.")
                _firebase_initialized = True
                return
            except json.JSONDecodeError as e:
                logger.error(f"Firebase 자격증명 JSON 파싱 실패: {e}")
        
        # 파일 경로로 초기화
        if firebase_credentials_path:
            cred_path = Path(firebase_credentials_path)
            if cred_path.exists():
                cred = credentials.Certificate(str(cred_path))
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK가 파일 경로로 초기화되었습니다: {cred_path}")
                _firebase_initialized = True
                return
        
        # 기본 경로 확인 (backend/firebase/serviceAccountKey.json)
        default_path = Path(__file__).parent / "serviceAccountKey.json"
        if default_path.exists():
            cred = credentials.Certificate(str(default_path))
            firebase_admin.initialize_app(cred)
            logger.info(f"Firebase Admin SDK가 기본 경로로 초기화되었습니다: {default_path}")
            _firebase_initialized = True
            return
        
        logger.warning("Firebase Admin SDK 초기화 실패: 자격증명 파일을 찾을 수 없습니다.")
        logger.warning("FCM_SERVER_KEY를 사용하는 레거시 방식으로 동작합니다.")
        
    except ImportError:
        logger.warning("firebase-admin 패키지가 설치되지 않았습니다. pip install firebase-admin을 실행하세요.")
    except Exception as e:
        logger.error(f"Firebase Admin SDK 초기화 중 오류 발생: {e}")

# 앱 시작 시 자동 초기화
initialize_firebase()
