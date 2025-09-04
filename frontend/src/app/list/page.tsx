"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ListPage() {
  const router = useRouter();

  useEffect(() => {
    console.log("ListPage: Client-side redirecting to /list/animal");
    router.replace("/list/animal");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div>리다이렉트 중...</div>
    </div>
  );
}
