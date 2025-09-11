"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import { PetCard } from "@/components/ui/PetCard";
import { useGetUserAdoptions } from "@/hooks/query/useGetUserAdoptions";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserAdoptionOut } from "@/types/adoption";

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
                onClick={() => router.push("/my")}
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
            return (
              <div
                key={adoption.id}
                className="cursor-pointer"
                onClick={() => {
                  // 입양 상태에 따라 해당 스텝 페이지로 이동
                  const status = adoption.status;
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
                    // 기본값은 request 페이지로
                    router.push(`/my/adoption/${adoption.id}/request`);
                  }
                }}
              >
                <PetCard
                  variant="variant4"
                  pet={{
                    id: adoption.animal_id,
                    name: adoption.animal_name || "이름 없음",
                    isFemale: adoption.animal_is_female,
                    breed: adoption.animal_breed || "종 미등록",
                    protection_status: "보호중",
                    adoption_status: (() => {
                      // adoption status를 기준으로 표시할 상태 결정
                      const adoptionStatus = adoption.status;
                      switch (adoptionStatus) {
                        case "신청":
                          return "입양진행중";
                        case "미팅":
                          return "입양진행중";
                        case "계약서작성":
                          return "입양진행중";
                        case "입양완료":
                          return "입양완료";
                        case "모니터링":
                          return "입양완료";
                        case "취소":
                          return "입양가능";
                        default:
                          return "입양가능";
                      }
                    })(),
                    centerId: adoption.center_id,
                    animalImages: adoption.animal_image
                      ? [
                          {
                            id: "1",
                            imageUrl: adoption.animal_image,
                            orderIndex: 0,
                          },
                        ]
                      : [],
                    foundLocation: adoption.center_location || "",
                  }}
                  adoptionStatus={adoption.status} // adoption status 전달
                  showLocation={false}
                />
              </div>
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
