"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";
import { SectionLine } from "@/app/centerpage/adoptorlist/application/_components/SectionLine";
import { useGetCenterAdoption } from "@/hooks";
import { useGetAdoptionMonitoringPosts } from "@/hooks/query/useGetAdoptionMonitoringPosts";
import { transformRawAnimalToPetCard } from "@/types/animal";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { useUpdateAdoptionStatus } from "@/hooks/mutation/useUpdateAdoptionStatus";
import { useSendContract } from "@/hooks/mutation/useSendContract";
import { useGetCenterProcedureSettings } from "@/hooks/query/useGetCenterProcedureSettings";

interface AdoptionMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMeetingPage({
  params,
}: AdoptionMeetingPageProps) {
  const router = useRouter();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [centerNotes, setCenterNotes] = useState<string>("");
  const [meetingScheduledAt, setMeetingScheduledAt] = useState<string>("");
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [userMemo, setUserMemo] = useState("");

  const { id } = use(params);

  // 개별 입양 신청 조회
  const {
    data: adoptionData,
    isLoading: adoptionLoading,
    error: adoptionError,
  } = useGetCenterAdoption(id);

  // 입양 모니터링 포스트 조회
  const {
    data: monitoringPostsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetAdoptionMonitoringPosts(id, 1, 10);

  // 동물 정보 가져오기 (입양 데이터에서 animal_id 추출)
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoptionData?.animal_id || "");

  // 입양 상태 변경 훅
  const updateStatusMutation = useUpdateAdoptionStatus();

  // 계약서 전송 훅
  const sendContractMutation = useSendContract();

  // 센터 절차 설정 (계약서 템플릿 목록)
  const { data: procedureSettings, isLoading: isLoadingSettings } =
    useGetCenterProcedureSettings();

  // user_memo 초기값 설정
  React.useEffect(() => {
    if (adoptionData?.user_memo !== undefined) {
      setUserMemo(adoptionData.user_memo || "");
    }
  }, [adoptionData?.user_memo]);

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);
    router.back();
  };

  const handleWithdrawCancel = () => {
    setShowWithdrawModal(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewApplicationForm = () => {
    if (adoptionData) {
      router.push(`/centerpage/adoptorlist/application/${id}/applicationForm`);
    }
  };

  const handleViewConsent = () => {
    if (adoptionData) {
      router.push(`/centerpage/adoptorlist/application/${id}/consentform`);
    }
  };

  const handleStatusChange = () => {
    if (!selectedStatus) return;

    updateStatusMutation.mutate(
      {
        adoptionId: id,
        status: selectedStatus as
          | "미팅"
          | "계약서작성"
          | "입양완료"
          | "모니터링"
          | "취소",
        center_notes: centerNotes || null,
        meeting_scheduled_at: meetingScheduledAt || null,
      },
      {
        onSuccess: () => {
          setShowStatusModal(false);
        },
        onError: (error) => {
          console.error("상태 변경 실패:", error);
          // 에러 처리 로직 추가 가능
        },
      }
    );
  };

  const handleContractSend = () => {
    setShowContractModal(true);
  };

  const handleContractSendConfirm = () => {
    if (!selectedTemplateId) {
      alert("계약서 템플릿을 선택해주세요.");
      return;
    }

    // 1) 먼저 상태를 "계약서작성"으로 변경
    updateStatusMutation.mutate(
      {
        adoptionId: id,
        status: "계약서작성",
        center_notes: null,
        user_memo: userMemo,
        meeting_scheduled_at: null,
      },
      {
        onSuccess: () => {
          // 2) 상태 변경 성공 시 계약서 전송
          sendContractMutation.mutate(
            {
              adoptionId: id,
              templateId: selectedTemplateId as string,
              customContent: undefined,
              centerNotes: undefined,
            },
            {
              onSuccess: () => {
                setShowContractModal(false);
                setShowToast(true);
                // 3초 후 토스트 숨기고 리다이렉트
                setTimeout(() => {
                  setShowToast(false);
                  router.push("/centerpage/adoptorlist/application");
                }, 3000);
              },
              onError: (error) => {
                console.error("계약서 전송 실패:", error);
                alert("계약서 전송에 실패했습니다.");
              },
            }
          );
        },
        onError: (error) => {
          console.error("상태를 '계약서작성'으로 변경 실패:", error);
          alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
        },
      }
    );
  };

  const handleReject = () => {
    setSelectedStatus("취소");
    setShowStatusModal(true);
  };

  // 로딩 상태 처리
  if (adoptionLoading || animalLoading) {
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
  if (adoptionError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="mb-2 text-red-500">
            입양 신청 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          <div className="text-sm text-gray-500">{adoptionError.message}</div>
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
              <h4>{adoptionData.user_info.name}</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="relative z-10 flex-1 -mt-4 bg-white rounded-t-3xl">
          <div className="p-4">
            {/* Main Title */}
            <h2 className="flex justify-center mb-6 itemx-center text-bk">
              미팅이 필요하다면 진행해주세요!
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={2} className="mb-6" />

            {/* Pet Info */}
            <SectionLine>
              <h3 className="mb-3 text-bk">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>

            <SectionLine>
              {/* 사용자 정보 */}
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
              <div className="flex flex-col items-center gap-2">
                <BigButton
                  variant="variant5"
                  onClick={handleViewApplicationForm}
                  className="w-full py-4"
                >
                  신청서 보기
                </BigButton>
                <BigButton
                  variant="variant5"
                  onClick={handleViewConsent}
                  className="w-full py-4"
                >
                  동의서 보기
                </BigButton>
              </div>
              
              {/* User Memo Section */}
              <div className="mt-4 mb-6">
                <h3 className="mb-3 text-bk">신청자 메모</h3>
                <div className="p-4 bg-white rounded-lg">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={4}
                    placeholder="입양 신청자에 대한 메모를 입력하세요..."
                    value={userMemo}
                    onChange={(e) => setUserMemo(e.target.value)}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    이 메모는 상태 변경 시 함께 저장됩니다.
                  </div>
                </div>
              </div>
            </SectionLine>

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
                      onClick={() => router.push(`/community/${post.id}`)}
                    >
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {post.user_nickname}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {post.content}
                            </p>
                            {Array.isArray(post.images) && post.images.length > 0 && (
                              <div className="mt-3">
                                <Image
                                  src={post.images[0]}
                                  alt="게시글 이미지"
                                  className="object-cover w-16 h-16 bg-gray-200 rounded-lg"
                                  width={64}
                                  height={64}
                                  loading="lazy"
                                />
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

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <BigButton
                variant="primary"
                onClick={handleReject}
                className="w-full py-4 bg-red"
              >
                거절
              </BigButton>
              <BigButton
                variant="primary"
                onClick={handleContractSend}
                className="w-full py-4"
              >
                계약서 전송
              </BigButton>
            </div>
          </div>
        </div>

        {/* Status Change Modal */}
        <BottomSheet
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          variant="primary"
          title={`상태를 "${selectedStatus}"로 변경하시겠습니까?`}
          description="변경 후 되돌릴 수 없습니다."
          leftButtonText="취소"
          rightButtonText="변경"
          onLeftClick={() => setShowStatusModal(false)}
          onRightClick={handleStatusChange}
        >
          <div className="p-4 space-y-4">
            {selectedStatus === "계약서작성" && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  계약서 작성 예정 시간
                </label>
                <input
                  type="datetime-local"
                  value={meetingScheduledAt}
                  onChange={(e) => setMeetingScheduledAt(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                센터 메모
              </label>
              <textarea
                value={centerNotes}
                onChange={(e) => setCenterNotes(e.target.value)}
                placeholder="메모를 입력하세요..."
                className="w-full h-20 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </BottomSheet>

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

        {/* Contract Send Modal */}
        <BottomSheet
          open={showContractModal}
          onClose={() => setShowContractModal(false)}
          variant="variant5"
          title="계약서 전송"
          description="입양자에게 전송할 계약서를 선택하세요"
          confirmButtonText={
            sendContractMutation.isPending ? "전송 중..." : "전송"
          }
          onConfirm={handleContractSendConfirm}
          confirmButtonDisabled={
            !selectedTemplateId || sendContractMutation.isPending
          }
        >
          <div className="flex flex-col items-left">
            {/* 계약서 템플릿 선택 */}
            <div className="flex flex-col items-left">
              <h3 className="mb-8 text-bk">계약서 템플릿 선택*</h3>
              {isLoadingSettings ? (
                <div className="text-sm text-gr">템플릿을 불러오는 중...</div>
              ) : procedureSettings?.contract_templates &&
                procedureSettings.contract_templates.length > 0 ? (
                <div className="flex flex-col gap-2 items-left">
                  {procedureSettings.contract_templates.map((template) => (
                    <label
                      key={template.id}
                      className="flex items-center space-x-2 items-left"
                    >
                      <input
                        type="radio"
                        name="contractTemplate"
                        value={template.id}
                        checked={selectedTemplateId === template.id}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">{template.title}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  등록된 계약서 템플릿이 없습니다.
                </div>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* Toast */}
        {showToast && (
          <div className="fixed bottom-4 left-4 right-4 z-[10000]">
            <Toast>입양자에게 계약서를 전송했습니다.</Toast>
          </div>
        )}

        {/* @TODO 사용자에게 거절 알람 토스트 추후 추가 */}
      </Container>
    </div>
  );
}
