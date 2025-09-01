"use client";

import React, { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "../../_components/SectionLine";
import { useGetCenterAdoptions } from "@/hooks/query/useGetCenterAdoptions";
import { useGetAdoptionMonitoringPosts } from "@/hooks/query/useGetAdoptionMonitoringPosts";
import { transformRawAnimalToPetCard } from "@/types/animal";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { useWithdrawAdoption } from "@/hooks/mutation";
import { MiniButton } from "@/components/ui/MiniButton";

interface AdoptionMonitoringPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMonitoringPage({
  params,
}: AdoptionMonitoringPageProps) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { id } = use(params);

  // 센터 입양 신청 목록 조회
  const {
    data: adoptionsData,
    isLoading,
    error,
  } = useGetCenterAdoptions({
    page: 1,
    limit: 100, // 충분한 데이터를 가져오기 위해 큰 값 설정
  });

  // 현재 입양 신청 찾기
  const adoptionData = useMemo(() => {
    if (!adoptionsData?.data) return null;
    return adoptionsData.data.find((adoption) => adoption.id === id) || null;
  }, [adoptionsData, id]);

  // 입양 모니터링 포스트 조회
  const {
    data: monitoringPostsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetAdoptionMonitoringPosts(id, 1, 10);

  const { mutate: withdrawAdoption, isPending: isWithdrawing } =
    useWithdrawAdoption();

  // 동물 정보 가져오기 (입양 데이터에서 animal_id 추출)
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoptionData?.animal_id || "");

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);

    // 입양 신청 철회 API 호출
    withdrawAdoption(id, {
      onSuccess: (data) => {
        console.log("철회 완료:", data.message);
        setShowToast(true);
        // 3초 후 토스트 숨기기
        setTimeout(() => {
          setShowToast(false);
          router.back();
        }, 3000);
      },
      onError: (error) => {
        console.error("철회 실패:", error);
        // 에러 토스트 표시
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      },
    });
  };

  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
  };
  const handleBack = () => {
    router.back();
  };

  // 로딩 상태 처리
  if (isLoading || animalLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!adoptionData || !animalData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">데이터를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            입양 신청 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{error.message}</div>
        </div>
      </div>
    );
  }

  if (animalError) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            동물 정보를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{animalError.message}</div>
        </div>
      </div>
    );
  }

  // PetCard에 전달할 데이터 변환
  const petCardData = transformRawAnimalToPetCard(animalData);

  if (!petCardData) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500">동물 정보를 변환할 수 없습니다.</div>
        </div>
      </div>
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
              <h4>{adoptionData.user_info?.name || "사용자"}</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              성공적으로 입양이 완료되었어요 !
            </h2>
            <DotProgressBar currentStep={5} className="mb-6" />
            <SectionLine>
              <h2 className="text-bk mb-2">모니터링 현황</h2>
              <div className="flex items-center gap-2 text-sm">
                <h6 className="text-red">모니터링 진행중</h6>
                <span className="text-gr">|</span>
                <h6 className="text-gr">남은 횟수 10회</h6>
                <span className="text-gr">|</span>
                <h6 className="text-gr">남은 기간 3개월 1주</h6>
              </div>
            </SectionLine>
            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>
            <SectionLine>
              {/* 입양 신청자 정보 */}
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
                          <div className="py-1 px-3">
                            {adoptionData.user_info.name}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          전화번호
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.user_info.phone || "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          주소
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.user_info.address || "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          신청일
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.timeline?.applied_at
                              ? new Date(
                                  adoptionData.timeline.applied_at
                                ).toLocaleDateString()
                              : "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gr h5 py-1 pr-3 align-top w-20">
                          메모
                        </td>
                        <td className="text-sm py-1">
                          <div className="py-1 px-3">
                            {adoptionData.notes || "-"}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionLine>

            {/* 입양 신청자가 올린 글 */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청자가 올린 글</h3>
              {isPostsLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-200 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : postsError ? (
                <div className="text-center py-8 text-gray-500">
                  아직 업로드된 게시글이 없어요.
                  {/* TODO 권한 확인 */}
                </div>
              ) : !monitoringPostsData?.data ||
                monitoringPostsData.data.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-lg text-sm mb-4">
                    아직 업로드된 게시글이 없어요.
                    <br />첫 번째 게시글을 작성해보세요!
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {monitoringPostsData.data.map((post) => (
                    <div
                      key={post.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/community/${post.id}`)}
                    >
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm text-gray-900">
                                {post.user_nickname}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {post.content}
                            </p>
                            {post.images && post.images.length > 0 && (
                              <div className="mt-3">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionLine>

            <div className="flex flex-col items-center gap-2 mt-6">
              <BigButton
                variant="variant5"
                onClick={() =>
                  router.push(
                    `/centerpage/adoptorlist/application/${id}/applicationForm`
                  )
                }
                className="w-full py-4"
              >
                신청서 보기
              </BigButton>
              <BigButton
                variant="variant5"
                onClick={() =>
                  router.push(
                    `/centerpage/adoptorlist/application/${id}/consentform`
                  )
                }
                className="w-full py-4"
              >
                동의서 보기
              </BigButton>
              <MiniButton
                text={isWithdrawing ? "철회 중..." : "입양 신청 철회하기"}
                variant="primary"
                leftIcon={<X size={16} />}
                onClick={handleWithdrawClick}
                disabled={isWithdrawing}
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
      </Container>
    </div>
  );
}
