"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
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
import {
  calculateRemainingMonitoringPeriod,
  calculateRemainingMonitoringChecks,
  calculateDaysUntilNextMonitoring,
} from "@/lib/utils";

export default function AdoptionMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user } = useAuth();

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
              {adoption.monitoring_next_check_at
                ? `${calculateDaysUntilNextMonitoring(
                    adoption.monitoring_next_check_at
                  )}일 후`
                : "곧"}{" "}
              모니터링 기간이 돌아와요, 앞으로{" "}
              {calculateRemainingMonitoringChecks(
                adoption.monitoring_total_checks || 0,
                adoption.monitoring_completed_checks || 0
              )}
              회 남았어요.
            </InfoCard>
            <div className="mb-6">
              <h3 className="text-bk mb-1">모니터링 현황</h3>
              <div className="flex items-center gap-2">
                <h6 className="text-gr">
                  남은횟수{" "}
                  {calculateRemainingMonitoringChecks(
                    adoption.monitoring_total_checks || 0,
                    adoption.monitoring_completed_checks || 0
                  )}
                  회
                </h6>
                <h6 className="text-gr">|</h6>
                <h6 className="text-gr">
                  남은 기간{" "}
                  {adoption.monitoring_end_date
                    ? calculateRemainingMonitoringPeriod(
                        adoption.monitoring_end_date
                      )
                    : "정보 없음"}{" "}
                  남았어요
                </h6>
              </div>
            </div>
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
                  animalImages: adoption.animal_image
                    ? [
                        {
                          id: "1",
                          imageUrl: adoption.animal_image,
                          orderIndex: 0,
                        },
                      ]
                    : [],
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

            {/* Question Responses */}
            {adoptionDetail.question_responses &&
              adoptionDetail.question_responses.length > 0 && (
                <SectionLine>
                  <div className="mb-6">
                    <h3 className="text-bk mb-3">질문 응답</h3>
                    <div className="space-y-3">
                      {adoptionDetail.question_responses.map((response) => (
                        <div
                          key={response.id}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="font-medium text-gray-700 mb-1">
                            {response.question_content}
                          </div>
                          <div className="text-gray-600">{response.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionLine>
              )}

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
              <BigButton
                variant="variant5"
                onClick={() => {
                  const contractData = {
                    adoptionId: id,
                    animalName: adoption.animal_name,
                    centerName: adoption.center_name,
                    contractContent:
                      adoptionDetail.contract?.contract_content ||
                      "계약서 내용이 준비되지 않았습니다.",
                  };
                  const encodedData = encodeURIComponent(
                    JSON.stringify(contractData)
                  );
                  router.push(`/adoption/contract?data=${encodedData}`);
                }}
                className="w-full py-4 my-3"
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
