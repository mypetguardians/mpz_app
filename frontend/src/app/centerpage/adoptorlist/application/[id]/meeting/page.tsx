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

import {
  useGetCenterAdoption,
  useGetAdoptionMonitoringPosts,
  useGetAnimalById,
  useUpdateAdoptionStatus,
  useSendContract,
  useGetCenterProcedureSettings,
} from "@/hooks";
import { transformRawAnimalToPetCard } from "@/types/animal";

interface AdoptionMeetingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionMeetingPage({
  params,
}: AdoptionMeetingPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [userMemo, setUserMemo] = useState("");

  // 데이터 로드
  const {
    data: adoptionData,
    isLoading: adoptionLoading,
    error: adoptionError,
  } = useGetCenterAdoption(id);
  const {
    data: monitoringPostsData,
    isLoading: isPostsLoading,
    error: postsError,
  } = useGetAdoptionMonitoringPosts(id, 1, 10);
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoptionData?.animal_id || "");
  const { data: procedureSettings, isLoading: isLoadingSettings } =
    useGetCenterProcedureSettings();

  // 뮤테이션
  const updateStatusMutation = useUpdateAdoptionStatus();
  const sendContractMutation = useSendContract();

  // 계약서 템플릿 기본값 설정
  React.useEffect(() => {
    const templates = procedureSettings?.contract_templates ?? [];
    if (templates.length === 0) {
      setSelectedTemplateId("");
      return;
    }
    const nextTemplate = templates.find((t) => t.is_active) ?? templates[0];
    setSelectedTemplateId(nextTemplate.id);
  }, [procedureSettings?.contract_templates]);

  // user_memo 초기화
  React.useEffect(() => {
    if (adoptionData?.user_memo !== undefined) {
      setUserMemo(adoptionData.user_memo || "");
    }
  }, [adoptionData?.user_memo]);

  // ---------- 🧩 핸들러 ----------

  const handleBack = () => router.back();

  const handleViewApplicationForm = () => {
    if (adoptionData)
      router.push(`/centerpage/adoptorlist/application/${id}/applicationForm`);
  };

  const handleViewConsent = () => {
    if (adoptionData)
      router.push(`/centerpage/adoptorlist/application/${id}/consentform`);
  };

  /** ✅ 계약서 전송 플로우 */
  const handleContractSendConfirm = () => {
    if (sendContractMutation.isPending) return;

    if (!selectedTemplateId) {
      alert(
        isLoadingSettings
          ? "계약서 템플릿 정보를 불러오는 중입니다."
          : "등록된 계약서 템플릿이 없습니다."
      );
      return;
    }

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
          sendContractMutation.mutate(
            {
              adoptionId: id,
              templateId: selectedTemplateId,
              customContent: undefined,
              centerNotes: undefined,
            },
            {
              onSuccess: () => {
                setToastMessage("입양자에게 계약서를 전송했습니다.");
                setShowToast(true);
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
          console.error("상태 변경 실패:", error);
          alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
        },
      }
    );
  };

  /** ✅ 거절 플로우 */
  const handleRejectClick = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawCancel = () => setShowWithdrawModal(false);

  const handleWithdrawConfirm = () => {
    setShowWithdrawModal(false);
    updateStatusMutation.mutate(
      {
        adoptionId: id,
        status: "취소",
        center_notes: null,
        user_memo: userMemo,
        meeting_scheduled_at: null,
      },
      {
        onSuccess: () => {
          setToastMessage("입양 신청을 거절했습니다.");
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
            router.push("/centerpage/adoptorlist/application");
          }, 3000);
        },
        onError: (error) => {
          console.error("거절 실패:", error);
          alert("입양 거절 처리에 실패했습니다.");
        },
      }
    );
  };

  // ---------- 🧩 상태별 렌더 ----------

  if (adoptionLoading || animalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!adoptionData || !animalData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-red-500">데이터를 찾을 수 없습니다.</div>
      </div>
    );
  }

  if (adoptionError || animalError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-red-500">데이터 로딩 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  const petCardData = transformRawAnimalToPetCard(animalData);
  if (!petCardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-red-500">동물 정보를 변환할 수 없습니다.</div>
      </div>
    );
  }

  // ---------- 🧩 UI ----------

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
            <h2 className="flex justify-center mb-6 text-bk">
              미팅이 필요하다면 진행해주세요!
            </h2>
            <DotProgressBar currentStep={2} className="mb-6" />

            {/* 동물 정보 */}
            <SectionLine>
              <h3 className="mb-3 text-bk">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>

            {/* 입양자 정보 */}
            <SectionLine>
              <h3 className="mb-3 text-bk">입양 신청자 정보</h3>
              <div className="bg-white rounded-lg">
                <table className="w-full gap-y-2.5">
                  <tbody>
                    <tr>
                      <td className="w-20 text-gr h5">이름</td>
                      <td>{adoptionData.user_info.name}</td>
                    </tr>
                    <tr>
                      <td className="w-20 text-gr h5">전화번호</td>
                      <td>{adoptionData.user_info.phone || "-"}</td>
                    </tr>
                    <tr>
                      <td className="w-20 text-gr h5">주소</td>
                      <td>{adoptionData.user_info.address || "-"}</td>
                    </tr>
                    <tr>
                      <td className="w-20 text-gr h5">신청일</td>
                      <td>
                        {adoptionData.timeline?.applied_at
                          ? new Date(
                              adoptionData.timeline.applied_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-20 text-gr h5">메모</td>
                      <td>{adoptionData.notes || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-center gap-2 mt-4">
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
            </SectionLine>

            {/* 모니터링 게시글 */}
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
              ) : postsError || !monitoringPostsData?.data?.length ? (
                <div className="py-8 text-center text-gray-500">
                  아직 업로드된 게시글이 없어요.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {monitoringPostsData.data.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-white border rounded-lg cursor-pointer"
                      onClick={() => router.push(`/community/${post.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              {post.user_nickname}
                            </span>
                            <span className="text-xs text-gray-500">
                              {post.created_at
                                ? new Date(post.created_at).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                          <h4 className="mb-2 font-medium line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {post.content}
                          </p>
                          {Array.isArray(post.images) &&
                            post.images.length > 0 &&
                            (() => {
                              const first = post.images[0];
                              const src =
                                typeof first === "string"
                                  ? first
                                  : first?.image_url ?? "";
                              return src ? (
                                <Image
                                  src={src}
                                  alt="게시글 이미지"
                                  width={64}
                                  height={64}
                                  className="mt-3 rounded-lg object-cover"
                                />
                              ) : null;
                            })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionLine>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <Container className="p-4">
            <div className="flex items-center gap-3">
              <BigButton
                variant="primary"
                onClick={handleRejectClick}
                className="w-full py-4 bg-red hover:bg-red/70"
              >
                거절
              </BigButton>
              <BigButton
                variant="primary"
                onClick={handleContractSendConfirm}
                className="w-full py-4"
                disabled={sendContractMutation.isPending}
              >
                {sendContractMutation.isPending ? "전송 중..." : "계약서 전송"}
              </BigButton>
            </div>
          </Container>
        </div>

        {/* 거절 모달 */}
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
            <Toast>{toastMessage}</Toast>
          </div>
        )}
      </Container>
    </div>
  );
}
