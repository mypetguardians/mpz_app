"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { NotificationCardSkeleton } from "@/components/ui";
import { NotificationCard } from "./_components/NotificationCard";
import { useSuperadminNotices } from "@/hooks/query/useSuperadminNotices";
import { getRelativeTime } from "@/lib/utils";

export default function Notification() {
  const router = useRouter();
  const { data: superNotices, error, isLoading } = useSuperadminNotices();

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
              size="iconS"
              onClick={handleBack}
            />
            <h4>공지사항</h4>
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

        {superNotices?.notices && superNotices.notices.length > 0 ? (
          superNotices.notices.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              variant="primary"
              message={item.title}
              date={getRelativeTime(item.created_at)}
              isImportant={item.notice_type === "important" || item.is_pinned}
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
