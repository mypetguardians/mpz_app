"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { DotProgressBar } from "@/components/ui/DotProgressBar";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../../_components/SectionLine";
import {
  useGetCenterAdoption,
  useUpdateAdoptionMemo,
  useUpdateAdoptionStatus,
  useToast,
} from "@/hooks";
import { useGetAdoptionMonitoringPosts } from "@/hooks/query/useGetAdoptionMonitoringPosts";
import { transformRawAnimalToPetCard } from "@/types/animal";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";

interface AdoptionWritingPageProps {
  params: Promise<{ id: string }>;
}

export default function AdoptionWritingPage({
  params,
}: AdoptionWritingPageProps) {
  const router = useRouter();
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

  // 메모 상태
  const [memo, setMemo] = useState<string>("");
  const { mutate: updateMemo, isPending: isSaving } = useUpdateAdoptionMemo();
  const { showToast } = useToast();
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateAdoptionStatus();

  // 초기값 세팅
  useEffect(() => {
    if (adoptionData?.center_notes || adoptionData?.notes) {
      setMemo(adoptionData.center_notes ?? adoptionData.notes ?? "");
    }
  }, [adoptionData?.center_notes, adoptionData?.notes]);

  const handleSaveMemo = () => {
    if (!adoptionData) return;
    updateMemo(
      {
        adoptionId: adoptionData.id,
        center_notes: memo,
      },
      {
        onSuccess: () => {
          showToast("메모가 저장되었습니다.", "success");
        },
        onError: () => {
          showToast("메모 저장 중 오류가 발생했습니다.", "error");
        },
      }
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleCompleteAdoption = () => {
    if (!adoptionData) return;
    updateStatus(
      {
        adoptionId: adoptionData.id,
        status: "입양완료",
      },
      {
        onSuccess: () => {
          showToast("입양 상태가 '입양완료'로 변경되었습니다.", "success");
          router.refresh();
        },
        onError: () => {
          showToast("상태 변경 중 오류가 발생했습니다.", "error");
        },
      }
    );
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
      <Container className="min-h-screen pb-16">
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
            <h2 className="flex items-center justify-center mb-6 text-bk">
              예비 입양자의 계약서 동의를 기다리고 있어요
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={3} className="mb-6" />

            {/* Pet Info */}
            <SectionLine>
              <h3 className="mb-3 text-bk">입양 신청 동물</h3>
              <PetCard pet={petCardData} variant="variant4" />
            </SectionLine>
            <SectionLine>
              {/* My Information */}
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
                <div className="flex flex-col items-center gap-2 mt-6">
                  {adoptionData?.status === "입양완료" && (
                    <BigButton
                      variant="variant5"
                      className="w-full py-4"
                      onClick={() =>
                        router.push(
                          `/centerpage/adoptorlist/application/${id}/contractform`
                        )
                      }
                    >
                      계약서 보기
                    </BigButton>
                  )}
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
                                {post.created_at
                                  ? new Date(
                                      post.created_at
                                    ).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                            <h4 className="mb-2 font-medium text-gray-900 line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {post.content}
                            </p>
                            {Array.isArray(post.images) &&
                              post.images.length > 0 && (
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
            {/* 메모 입력 영역 */}
            <SectionLine>
              <h3 className="mb-3 text-bk">내 메모</h3>
              <textarea
                className="w-full p-3 text-sm bg-white border border-gray-200 rounded-lg min-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이 입양 신청 건에 대한 메모를 작성하세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <BigButton
                  variant="variant5"
                  onClick={handleSaveMemo}
                  className="px-6 py-3"
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "메모 저장"}
                </BigButton>
              </div>
            </SectionLine>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[420px] mx-auto bg-white/90 backdrop-blur px-4 py-3 border-t border-gray-200">
          <BigButton
            className="w-full"
            onClick={handleCompleteAdoption}
            disabled={isUpdating || adoptionData?.status === "입양완료"}
          >
            {adoptionData?.status === "입양완료"
              ? "이미 입양완료 상태입니다"
              : isUpdating
              ? "변경 중..."
              : "입양완료로 변경"}
          </BigButton>
        </div>
      </Container>
    </div>
  );
}
