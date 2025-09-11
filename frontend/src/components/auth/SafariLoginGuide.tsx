"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isIOSSafari } from "@/lib/storage-utils";

interface SafariLoginGuideProps {
  onRetry?: () => void;
  onClose?: () => void;
}

export function SafariLoginGuide({ onRetry, onClose }: SafariLoginGuideProps) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // iOS Safari 환경에서만 가이드 표시
    setShowGuide(isIOSSafari());
  }, []);

  if (!showGuide) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
    setShowGuide(false);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    setShowGuide(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-center">
            🦄 Safari 카카오 로그인 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Safari에서 카카오 로그인이 원활하지 않을 수 있습니다. 아래 설정을
              확인해주세요.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2">
                📱 iPhone/iPad 설정
              </h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. 설정 앱 → Safari</li>
                <li>2. &apos;개인정보 보호 및 보안&apos; 섹션</li>
                <li>3. &apos;모든 쿠키 차단&apos; → OFF</li>
                <li>4. &apos;크로스 사이트 추적 방지&apos; → OFF</li>
              </ol>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2">🖥️ Mac Safari 설정</h4>
              <ol className="text-sm space-y-1 text-gray-600">
                <li>1. Safari → 설정...</li>
                <li>2. &apos;개인정보 보호&apos; 탭</li>
                <li>3. &apos;크로스 사이트 추적 방지&apos; 체크 해제</li>
                <li>4. &apos;웹사이트 데이터 관리&apos; → 삭제</li>
              </ol>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                💡 <strong>팁:</strong> 설정 변경 후 Safari를 완전히 종료했다가
                다시 실행해주세요.
                <br />
                🔄 <strong>추가:</strong> 문제가 지속되면 Safari 캐시를
                삭제해보세요.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-3 bg-blue-50">
              <h4 className="font-semibold text-sm mb-2">🚀 빠른 해결 방법</h4>
              <p className="text-sm text-gray-600">
                Chrome, Edge, Firefox 등 다른 브라우저를 사용하시면 문제없이
                로그인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleRetry}
              className="flex-1 bg-yellow-400 text-black hover:bg-yellow-500"
            >
              다시 시도
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex-1">
              닫기
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            문제가 지속되면 Chrome 또는 Edge 브라우저를 이용해주세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SafariLoginGuide;
