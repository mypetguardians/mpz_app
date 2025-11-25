"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import { useGetUserAdoptions } from "@/hooks/query/useGetUserAdoptions";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserAdoptionOut } from "@/types/adoption";
import { AdoptorNotificationCard } from "@/app/centerpage/adoptorlist/_components/AdoptorNotificationCard";

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) {
    return "방금 전";
  }

  const targetDate = new Date(dateString);
  if (Number.isNaN(targetDate.getTime())) {
    return "방금 전";
  }

  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - targetDate.getTime()) / (1000 * 60)
  );

  if (diffInMinutes <= 1) {
    return "방금 전";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
};

export default function AdoptionPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: adoptionsData,
    isLoading: adoptionsLoading,
    error,
  } = useGetUserAdoptions();

  const handleBack = () => {
    router.back();
  };

  // 인증 정보가 로드되는 중인 경우
  if (authLoading) {
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
              <h4>내 입양 현황</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center text-sm py-8 text-lg">
            로그인 정보를 확인하는 중...
          </div>
        </div>
      </Container>
    );
  }

  // 사용자 정보가 로드되지 않은 경우
  if (!user) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => router.back()}
              />
              <h4>내 입양 현황</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8 text-red-500">
            로그인이 필요합니다.
          </div>
        </div>
      </Container>
    );
  }

  // 사용자 ID가 없는 경우
  if (!user.id) {
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
              <h4>내 입양 현황</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8 text-red-500">
            사용자 정보를 찾을 수 없습니다.
          </div>
        </div>
      </Container>
    );
  }

  // 입양 현황 데이터 로딩 중
  if (adoptionsLoading) {
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
              <h4>내 입양 현황</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8">입양 현황을 불러오는 중...</div>
        </div>
      </Container>
    );
  }

  // 입양 현황 데이터 에러
  if (error) {
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
              <h4>내 입양 현황</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8 text-red-500">
            입양 현황을 불러오는 중 오류가 발생했습니다.
            <br />
            <span className="text-sm text-gray-500">
              {error instanceof Error ? error.message : "알 수 없는 오류"}
            </span>
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
              onClick={() => router.push("/my")}
            />
            <h4>내 입양 현황</h4>
          </div>
        }
      />
      <div className="flex flex-col gap-3 px-4 py-4">
        {adoptionsData?.data && adoptionsData.data.length > 0 ? (
          adoptionsData.data.map((adoption: UserAdoptionOut) => {
            const status = adoption.status as
              | "신청"
              | "미팅"
              | "계약서작성"
              | "입양완료"
              | "모니터링"
              | "취소";

            const handleCardClick = () => {
              if (status === "신청") {
                router.push(`/my/adoption/${adoption.id}/request`);
              } else if (status === "미팅") {
                router.push(`/my/adoption/${adoption.id}/meeting`);
              } else if (status === "계약서작성") {
                router.push(`/my/adoption/${adoption.id}/writing`);
              } else if (status === "입양완료") {
                router.push(`/my/adoption/${adoption.id}/complete`);
              } else if (status === "모니터링") {
                router.push(`/my/adoption/${adoption.id}/monitoring`);
              } else if (status === "취소") {
                router.push(`/my/adoption/${adoption.id}/refuse`);
              } else {
                router.push(`/my/adoption/${adoption.id}/request`);
              }
            };

            return (
              <AdoptorNotificationCard
                key={adoption.id}
                id={adoption.id}
                userName={adoption.animal_name || "이름 없음"}
                profileImage={adoption.animal_image || "/img/dummyImg.png"}
                timeAgo={formatTimeAgo(adoption.updated_at)}
                status={status}
                isGrayscale={status === "취소"}
                apiStatus={status}
                onClick={handleCardClick}
                className="border border-gray-200 rounded-lg p-2"
              />
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            입양 신청 내역이 없습니다.
          </div>
        )}
      </div>
    </Container>
  );
}
