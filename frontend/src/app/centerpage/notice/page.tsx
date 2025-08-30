"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCardSkeleton } from "@/components/ui";
import { NotificationCard } from "./_components/NotificationCard";
import { useCenterNotices, useGetMyCenter } from "@/hooks/query";
import { getRelativeTime } from "@/lib/utils";

export default function Notification() {
  const router = useRouter();
  const { data: myCenter } = useGetMyCenter();
  const centerId = myCenter?.id;

  const {
    data: centerNoticesData,
    error,
    isLoading,
  } = useCenterNotices({ centerId: centerId || "", enabled: !!centerId });

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
            <h4>
              공지사항{" "}
              {centerNoticesData?.total ? `(${centerNoticesData.total}개)` : ""}
            </h4>
          </div>
        }
      />
      <div className="flex flex-col gap-4 p-4">
        {isLoading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <NotificationCardSkeleton key={index} />
            ))}
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

        {centerNoticesData?.notices && centerNoticesData.notices.length > 0 ? (
          centerNoticesData.notices.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              variant="primary"
              message={item.content}
              date={getRelativeTime(item.created_at)}
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
