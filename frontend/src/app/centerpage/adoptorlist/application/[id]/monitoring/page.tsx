"use client";

import React, { useState, use } from "react";
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
import { useGetCenterAdoption, useGetMyCenter } from "@/hooks";
import { useGetAdoptionMonitoringPosts } from "@/hooks/query/useGetAdoptionMonitoringPosts";
import { transformRawAnimalToPetCard } from "@/types/animal";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { useUpdateAdoptionStatus } from "@/hooks";
import { MiniButton } from "@/components/ui/MiniButton";
import instance from "@/lib/axios-instance";

interface AdoptionMonitoringPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMonitoringPage({
  params,
}: AdoptionMonitoringPageProps) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [openMonitoringSheet, setOpenMonitoringSheet] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSavingMonitoring, setIsSavingMonitoring] = useState(false);
  const { id } = use(params);

  // 개별 입양 신청 조회
  const { data: adoptionData, isLoading, error } = useGetCenterAdoption(id);

  // 입양 모니터링 포스트 조회
  const {
    data: monitoringPostsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetAdoptionMonitoringPosts(id, 1, 10);

  const updateStatus = useUpdateAdoptionStatus();
  const isWithdrawing = updateStatus.isPending;

  // 동물 정보 가져오기 (입양 데이터에서 animal_id 추출)
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoptionData?.animal_id || "");

  const {
    data: centerData,
    isLoading: centerLoading,
    error: centerError,
  } = useGetMyCenter();

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);

    // 센터 철회: 상태를 취소로 변경하며 사유를 center_notes로 전달
    updateStatus.mutate(
      {
        adoptionId: id,
        status: "취소",
        center_notes: withdrawReason || "센터에서 철회 처리",
        user_memo: null,
        meeting_scheduled_at: null,
      },
      {
        onSuccess: () => {
          setShowToast(true);
          // 3초 후 토스트 숨기기
          setTimeout(() => {
            setShowToast(false);
            router.back();
          }, 3000);
        },
        onError: (error) => {
          console.error("철회 실패:", error);
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
        },
      }
    );
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
  const handleConfirmMonitoringSettings = async () => {
    try {
      // 유효성 검사
      if (!startDate || !endDate) {
        setToastMessage("시작일과 종료일을 입력해주세요.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setToastMessage("종료일은 시작일 이후여야 합니다.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
        return;
      }

      setIsSavingMonitoring(true);
      // 센터 모니터링 사용 활성화만 수행(기간 값은 메모로 전달)
      await instance.put("/centers/procedures/settings/", {
        has_monitoring: true,
      });
      setOpenMonitoringSheet(false);

      const periodNote = `모니터링 기간: ${startDate} ~ ${endDate}`;
      // 상태를 모니터링으로 변경 + 기간을 센터 메모로 남김
      updateStatus.mutate(
        {
          adoptionId: id,
          status: "모니터링",
          center_notes: periodNote,
        },
        {
          onSuccess: () => {
            setToastMessage("모니터링이 시작되었습니다.");
            setShowToast(true);
            setTimeout(() => {
              setShowToast(false);
              router.refresh();
            }, 1500);
          },
          onError: () => {
            setToastMessage("상태 변경 중 오류가 발생했습니다.");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
          },
        }
      );
    } catch (error) {
      console.error("모니터링 설정 저장 중 오류가 발생했습니다:", error);
      setToastMessage("모니터링 설정 저장 중 오류가 발생했습니다.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } finally {
      setIsSavingMonitoring(false);
    }
  };

  // 로딩 상태 처리
  if (isLoading || animalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!adoptionData || !animalData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="text-red-500">데이터를 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="mb-2 text-red-500">
            입양 신청 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{error.message}</div>
        </div>
      </div>
    );
  }

  if (animalError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="mb-2 text-red-500">
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
      <div className="flex items-center justify-center min-h-screen bg-bg">
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
        <div className="relative z-10 flex-1 -mt-4 bg-white rounded-t-3xl">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex justify-center mb-6 itemx-center text-bk">
              성공적으로 입양이 완료되었어요 !
            </h2>
            <DotProgressBar currentStep={5} className="mb-6" />
            <SectionLine>
              <h2 className="mb-2 text-bk">모니터링 현황</h2>
              <div className="flex items-center gap-2 text-sm">
                <h6 className="text-red">
                  {centerLoading
                    ? "로딩 중..."
                    : centerError
                    ? "센터 정보를 불러올 수 없습니다"
                    : centerData?.monitoringPeriodMonths
                    ? `${centerData.monitoringPeriodMonths}개월 모니터링`
                    : "모니터링 기간 정보 없음"}
                </h6>
              </div>
            </SectionLine>
            {/* Pet Info */}
            <SectionLine>
              <h3 className="mb-3 text-bk">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>
            <SectionLine>
              {/* 입양 신청자 정보 */}
              <div className="mb-6">
                <h3 className="mb-3 text-bk">입양 신청자 정보</h3>
                <div className="p-4 bg-white rounded-lg">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          이름
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoptionData.user_info.name}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          전화번호
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoptionData.user_info.phone || "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          주소
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoptionData.user_info.address || "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          신청일
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoptionData.timeline?.applied_at
                              ? new Date(
                                  adoptionData.timeline.applied_at
                                ).toLocaleDateString()
                              : "-"}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          메모
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
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
              <h3 className="mb-3 text-bk">입양 신청자가 올린 글</h3>
              {isPostsLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : postsError ? (
                <div className="py-8 text-center text-gray-500">
                  아직 업로드된 게시글이 없어요.
                </div>
              ) : !monitoringPostsData?.data ||
                monitoringPostsData.data.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-4 text-sm text-lg">
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
                      onClick={() => router.push(`/community/${post.post_id}`)}
                    >
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                모니터링 글
                              </span>
                              <span className="text-xs text-gray-500">
                                {post.post_created_at
                                  ? new Date(
                                      post.post_created_at
                                    ).toLocaleDateString("ko-KR")
                                  : "날짜 정보 없음"}
                              </span>
                            </div>
                            <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">
                              {post.post_title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {post.post_content}
                            </p>
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
              <BigButton
                variant="variant5"
                onClick={() =>
                  router.push(
                    `/centerpage/adoptorlist/application/${id}/contractform`
                  )
                }
                className="w-full py-4"
              >
                계약서 보기
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
          variant="variant5"
          title="정말 철회하시겠습니까?"
          description={"철회 사유를 간단히 작성해주세요."}
          confirmButtonText="철회하기"
          onConfirm={handleWithdrawConfirm}
          confirmButtonDisabled={false}
        >
          <textarea
            className="w-full p-3 text-sm bg-white border border-gray-200 rounded-lg min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 일정 조율이 어려워졌습니다"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
          />
        </BottomSheet>

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 z-[10000]">
            <Toast>{toastMessage || "처리가 완료되었습니다."}</Toast>
          </div>
        )}

        {/* Monitoring Settings BottomSheet */}
        <BottomSheet
          open={openMonitoringSheet}
          onClose={() => !isSavingMonitoring && setOpenMonitoringSheet(false)}
          variant="variant5"
          title="모니터링 기간 설정"
          description="시작일과 종료일을 선택하세요."
          confirmButtonText={isSavingMonitoring ? "저장 중..." : "확인"}
          onConfirm={handleConfirmMonitoringSettings}
          confirmButtonDisabled={
            isSavingMonitoring ||
            !startDate ||
            !endDate ||
            new Date(startDate) > new Date(endDate)
          }
        >
          <div className="p-4 space-y-4">
            <div>
              <label className="block mb-2 text-sm text-gr">시작일</label>
              <input
                type="date"
                className="w-full p-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gr">종료일</label>
              <input
                type="date"
                className="w-full p-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </BottomSheet>
      </Container>
    </div>
  );
}
