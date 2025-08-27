"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useToggleCenterFavorite } from "@/hooks";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import { useAuth } from "@/components/providers/AuthProvider";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { InfoCard } from "@/components/ui/InfoCard";
import { CenterInfo } from "@/components/ui/CenterInfo";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../../_components/SectionLine";

export default function AdoptionMonitoringPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(true);
  const toggleCenterFavorite = useToggleCenterFavorite();

  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({
    adoptionId: params.id,
    userId: user?.id || "",
  });

  const handleBack = () => {
    router.push("/my/adoption");
  };

  const handleFavoriteToggle = () => {
    // 실제 API 호출
    if (adoptionDetail?.adoption.centerId) {
      toggleCenterFavorite.mutate({
        centerId: adoptionDetail.adoption.centerId,
      });
      setIsFavorite(!isFavorite);
    }
  };

  const handleViewConsent = () => {
    // 동의서 보기 로직
    console.log("동의서 보기");
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
              <h4>모니터링 상세</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (error || !adoptionDetail) {
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
              <h4>모니터링 상세</h4>
            </div>
          }
        />
        <div className="flex flex-col gap-3 px-4 py-4">
          <div className="text-center py-8 text-red-500">
            오류가 발생했습니다.
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Container className="min-h-screen">
        {/* TopBar */}
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>모니터링 상세</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              아이와의 일상이 궁금해요!
              <br />
              주기적인 모니터링 부탁드려요
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={5} className="mb-6" />

            {/* Info Card */}
            <InfoCard className="mb-6">
              n일 후 모니터링 기간이 돌아와요. 앞으로 {`10`}회 남아있어요.
            </InfoCard>
            <div className="mb-6">
              <h3 className="text-bk mb-1">모니터링 현황</h3>
              <div className="flex items-center gap-2">
                <h6 className="text-gr">남은횟수 {`10`}회</h6>
                <h6 className="text-gr">|</h6>
                <h6 className="text-gr">남은 기간 {`3개월 1주`} 남았어요</h6>
              </div>
            </div>
            {/* Center Info */}
            <SectionLine>
              <CenterInfo
                variant="primary"
                centerId={adoptionDetail.adoption.centerId}
                name={adoptionDetail.adoption.centerName}
                location={
                  adoptionDetail.adoption.centerLocation || "위치 정보 없음"
                }
                phoneNumber="000-000-0000"
                className="mb-6"
              />
            </SectionLine>

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard
                pet={{
                  id: adoptionDetail.adoption.animalId,
                  name: adoptionDetail.adoption.animalName,
                  isFemale: adoptionDetail.adoption.animalGender === "female",
                  breed: adoptionDetail.adoption.animalBreed || undefined,
                  status: "보호중" as const,
                  animalImages: [adoptionDetail.adoption.animalImage || ""],
                }}
                variant="variant4"
              />
            </SectionLine>
            <SectionLine>
              {/* My Information */}
              <div className="mb-6">
                <h3 className="text-bk mb-3">내 정보</h3>
                <div className="bg-white rounded-lg p-4">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          이름
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {user?.name || "사용자"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          닉네임
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {user?.nickname || "닉네임 없음"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          이메일
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {user?.email || "이메일 없음"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">전화번호 정보 없음</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionLine>

            {/* My Responses */}
            <SectionLine>
              <h3 className="text-bk mb-3">내 응답</h3>
              <div className="flex flex-col ">
                {adoptionDetail.questionResponses &&
                adoptionDetail.questionResponses.length > 0 ? (
                  adoptionDetail.questionResponses.map((response, index) => (
                    <div
                      key={index}
                      className="flex flex-col py-3 border-b border-bg"
                    >
                      <h5 className="text-gr">{response.questionContent}</h5>
                      <p className="text-bk body">{response.answer}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm py-3">
                    질문 응답이 없습니다.
                  </div>
                )}
              </div>
            </SectionLine>

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
              <BigButton
                variant="variant5"
                onClick={handleViewConsent}
                className="w-full py-4"
              >
                동의서 보기
              </BigButton>
              <BigButton
                variant="variant5"
                onClick={handleViewConsent}
                className="w-full py-4"
              >
                계약서 보기
              </BigButton>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
