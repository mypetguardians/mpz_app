"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react";
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
import { MiniButton } from "@/components/ui/MiniButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "../../_components/SectionLine";

export default function AdoptionRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { id } = React.use(params);

  const {
    data: adoptionDetail,
    isLoading,
    error,
  } = useGetUserAdoptionDetail({
    adoptionId: id,
  });

  const handleBack = () => {
    router.push("/my/adoption");
  };

  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);
    setShowToast(true);
    // 3초 후 토스트 숨기기
    setTimeout(() => {
      setShowToast(false);
      router.back();
    }, 3000);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
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
              <h4>입양 신청 상세</h4>
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
              <h4>입양 신청 상세</h4>
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

  const { adoption } = adoptionDetail;

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
              <h4>입양 신청 상세</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              센터의 확인을 기다리고 있어요
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={1} className="mb-6" />

            {/* 입양 신청 정보 */}
            <InfoCard className="mb-6">
              센터가 입양 신청을 수락하면, 다음 단계로 넘어가 센터 입양 절차에
              따라 진행해요.
            </InfoCard>

            {/* Center Info */}
            <SectionLine>
              <CenterInfo
                variant="primary"
                centerId={adoption.center_id}
                name={adoption.center_name}
                location={adoption.center_location || "위치 정보 없음"}
                phoneNumber="000-000-0000"
                className="mb-6"
              />
            </SectionLine>

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard
                pet={{
                  id: adoption.animal_id,
                  name: adoption.animal_name,
                  isFemale: adoption.animal_gender === "암컷",
                  breed: adoption.animal_breed || "종 미등록",
                  status: "보호중" as const,
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
                variant="variant4"
              />
            </SectionLine>
            <SectionLine>
              {/* My Information */}
              <div className="mb-6">
                <h3 className="text-bk mb-3">내 정보</h3>
                <div className="bg-white rounded-lg">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          이름
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {user?.nickname || "사용자"}
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

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
              <BigButton
                variant="variant5"
                onClick={() => {
                  router.push(`/my/adoption/${id}/applicationForm`);
                }}
                className="w-full py-4"
              >
                신청서 보기
              </BigButton>
              <BigButton
                variant="variant5"
                onClick={() => {
                  const guidelinesContent =
                    adoptionDetail.contract?.guidelines_content ||
                    "동의서 내용이 준비되지 않았습니다.";
                  const encodedContent = encodeURIComponent(guidelinesContent);
                  router.push(
                    `/my/adoption/${id}/consentForm?guidelines=${encodedContent}`
                  );
                }}
                className="w-full py-4"
              >
                동의서 보기
              </BigButton>
              <MiniButton
                text="입양 신청 철회하기"
                variant="primary"
                leftIcon={<X size={16} />}
                onClick={handleWithdrawClick}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Withdraw Modal */}
        <BottomSheet
          open={showWithdrawModal}
          onClose={handleWithdrawCancel}
          variant="primary"
          title="정말 철회하시겠습니까?"
          description={`${
            user?.nickname || "사용자"
          }님의 신중하고 현명한 결정을 존중해요.`}
          leftButtonText="아니요"
          rightButtonText="네, 철회할래요"
          onLeftClick={handleWithdrawCancel}
          onRightClick={handleWithdrawConfirm}
        />

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 z-[10000]">
            <Toast>입양 신청이 철회되었습니다.</Toast>
          </div>
        )}
      </Container>
    </div>
  );
}
