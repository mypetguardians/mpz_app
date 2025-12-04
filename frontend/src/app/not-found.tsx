import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="max-w-[420px] mx-auto w-full min-h-screen flex flex-col items-center justify-center px-6 text-center backdrop-blur-sm">
      <p className="text-sm text-gray-400 mb-2">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        주소가 잘못되었거나, 삭제되었을 수 있어요.
        <br />
        아래 버튼을 눌러 홈으로 돌아가 주세요.
      </p>
      <Button asChild className="w-full bg-brand text-white hover:bg-brand/90">
        <Link href="/">홈으로 이동</Link>
      </Button>
    </div>
  );
}

