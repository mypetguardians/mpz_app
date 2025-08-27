"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { useGetCenterNoticeById } from "@/hooks";

export default function Notification() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: notice, isLoading, error } = useGetCenterNoticeById(id);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
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
            </div>
          }
        />
        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col items-start gap-2">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </Container>
    );
  }

  if (error || !notice) {
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
            </div>
          }
        />
        <div className="flex flex-col gap-6 p-4">
          <div className="flex flex-col items-start gap-2">
            <h2 className="text-bk">공지사항을 찾을 수 없습니다</h2>
            <p className="body2 text-gr">
              {error?.message || "알 수 없는 오류가 발생했습니다"}
            </p>
          </div>
        </div>
      </Container>
    );
  }

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
          </div>
        }
      />
      <div className="flex flex-col gap-6 p-4">
        <div className="flex flex-col items-start gap-2">
          <h2 className="text-bk">{notice.title}</h2>
          <p className="body2 text-gr">{notice.createdAt}</p>
        </div>
        <p className="body text-dg">{notice.content}</p>
      </div>
    </Container>
  );
}
