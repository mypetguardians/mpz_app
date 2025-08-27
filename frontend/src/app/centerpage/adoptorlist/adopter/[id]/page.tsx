"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "../_components/SectionLine";
import RelatedPosts from "@/app/list/animal/[id]/_components/RelatedPosts";
import { mainPetInfo, user, adoptionResponses } from "@/app/mock";

export default function AdoptorlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const animal = mainPetInfo.find((item) => item.id === id);

  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
    console.log("동의서 보기");
  };

  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
  };

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);
    setShowToast(true);
    // 입양 신청 철회 로직
    console.log("입양 신청 철회");

    // 3초 후 토스트 숨기기
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
            <div className="py-7">
              <h2 className="text-bk mb-2">모니터링 현황</h2>
              <div className="flex items-center gap-2 text-sm">
                <h6 className="text-red">모니터링 3일 지연</h6>
                <span className="text-gr">|</span>
                <h6 className="text-gr">남은 횟수 10회</h6>
                <span className="text-gr">|</span>
                <h6 className="text-gr">남은 기간 3개월 1주</h6>
              </div>
            </div>

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard pet={mainPetInfo[0]} variant="variant4" />
            </SectionLine>

            {animal && (
              <RelatedPosts currentPet={animal} title="입양자가 올린 글" />
            )}

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
                          <div className="py-1 px-3">{user[0].address}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">{user[0].phoneNumber}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionLine>

            {/* My Responses */}
            <SectionLine>
              <h3 className="text-bk mb-3">폼 응답</h3>
              <div className="flex flex-col ">
                {adoptionResponses.map((response, index) => (
                  <div
                    key={index}
                    className="flex flex-col py-3 border-b border-bg"
                  >
                    <h5 className="text-gr">{response.question}</h5>
                    <p className="text-bk body">{response.answer}</p>
                  </div>
                ))}
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
      </Container>

      {/* Withdraw Modal */}
      <BottomSheet
        open={showWithdrawModal}
        onClose={handleWithdrawCancel}
        variant="primary"
        title="정말 철회하시겠습니까?"
        description="Username님의 신중하고 현명한 결정을 존중해요."
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
    </div>
  );
}
