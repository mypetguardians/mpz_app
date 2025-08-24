"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "../_components/SectionLine";
import RelatedPosts from "@/app/list/animal/[id]/_components/RelatedPosts";
import { mainPetInfo, user } from "@/app/mock";

interface AdoptionMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMeetingPage({
  params,
}: AdoptionMeetingPageProps) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { id } = use(params);
  const animal = mainPetInfo.find((item) => item.id === id);

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
  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
    // 동의서 보기 로직
    console.log("동의서 보기");
  };

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
              <h4>UserName</h4>
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
            <DotProgressBar currentStep={2} className="mb-6" />

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard
                pet={{
                  ...mainPetInfo[0],
                  healthNotes: mainPetInfo[0].healthNotes?.join(", ") || null,
                }}
                variant="variant4"
              />
            </SectionLine>
            <SectionLine>
              {/* My Information */}
              <div className="mb-6">
                <h3 className="text-bk mb-3">입양 신청자 정보</h3>
                <div className="bg-white rounded-lg p-4">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          이름
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">{user[0].nickname}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          생년월일
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">{user[0].birthDate}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          성별
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">{user[0].gender}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          주소
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3 flex items-center gap-1 text-gr">
                            {user[0].address}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3 flex items-center gap-1 text-gr">
                            {user[0].phoneNumber}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <BigButton
                  variant="variant5"
                  onClick={() => {}} // @TODO 계약서 전송 로직 추가 필요
                  className="w-full py-4"
                >
                  계약서 전송
                </BigButton>
                <BigButton
                  variant="variant5"
                  onClick={handleViewConsent}
                  className="w-full py-4"
                >
                  동의서 보기
                </BigButton>
              </div>
            </SectionLine>

            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청자가 올린 글</h3>
              {/* @TODO 사용자의 글로 연결 로직 추가 필요*/}
              {animal ? (
                // @ts-expect-error - 임시 타입 호환성 해결
                <RelatedPosts currentPet={animal} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  동물을 찾을 수 없습니다.
                </div>
              )}
            </SectionLine>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <BigButton
                variant="primary"
                onClick={handleViewConsent}
                className="w-full py-4 bg-red"
              >
                거절
              </BigButton>
              <BigButton
                variant="primary"
                onClick={handleViewConsent}
                className="w-full py-4"
              >
                수락
              </BigButton>
            </div>
          </div>
        </div>
        {/* Withdraw Modal */}
        <BottomSheet
          open={showWithdrawModal}
          onClose={handleWithdrawCancel}
          variant="primary"
          title="정말 거절하시겠습니까?"
          description="입양 신청자에게 거절 의사가 전달돼요."
          leftButtonText="아니요"
          rightButtonText="네, 거절할래요"
          onLeftClick={handleWithdrawCancel}
          onRightClick={handleWithdrawConfirm}
        />

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 z-[10000]">
            <Toast>입양 신청이 거절되었습니다.</Toast>
          </div>
        )}
        {/* @TODO 사용자에게 거절 알람 토스트 추후 추가 */}
      </Container>
    </div>
  );
}
