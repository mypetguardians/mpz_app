"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCard } from "./_components/NotificationCard";
import { useGetCenterNotices, useGetMyCenter } from "@/hooks/query";

export default function Notification() {
  const router = useRouter();
  const { data: myCenter } = useGetMyCenter();
  const centerId = myCenter?.id;

  const {
    data: centerNotices,
    error,
    isLoading,
  } = useGetCenterNotices(centerId || "");

  const handleBack = () => {
    router.back();
  };

  const handleNotificationClick = (id: string) => {
    router.push(`/centerpage/notice/${id}`);
  };

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>공지사항</h4>
          </div>
        }
      />
      <div className="flex flex-col gap-4 p-4">
        {isLoading && (
          <div className="text-center py-8">
            <p>공지사항을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            <p>알림 불러오기에 실패했습니다.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        )}

        {centerNotices && centerNotices.length > 0 ? (
          centerNotices.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              variant="primary"
              title={item.title}
              message={item.content}
              date={item.createdAt}
              onClick={() => handleNotificationClick(item.id)}
            />
          ))
        ) : !isLoading && !error ? (
          <div className="text-center py-8 text-gray-500">
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
