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
import { CenterInfo } from "@/components/ui/CenterInfo";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../../_components/SectionLine";
import { calculateRemainingMonitoringPeriod } from "@/lib/utils";
import { useGetCenterById } from "@/hooks/query/useGetCenters";

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
  const centerId = adoptionDetail?.adoption?.center_id;
  const { data: center, isLoading: isCenterLoading } =
    useGetCenterById(centerId);

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
  const calculateDerivedMonitoringEndDate = () => {
    if (adoption.monitoring_end_date) {
      return adoption.monitoring_end_date;
    }
    if (!adoption.monitoring_started_at || !center?.monitoringPeriodMonths) {
      return null;
    }
    const startDate = new Date(adoption.monitoring_started_at);
    const derivedEndDate = new Date(startDate);
    derivedEndDate.setMonth(
      derivedEndDate.getMonth() + center.monitoringPeriodMonths
    );
    return derivedEndDate.toISOString();
  };

  const remainingMonitoringPeriod = (() => {
    const endDate = calculateDerivedMonitoringEndDate();
    if (!endDate) {
      return "정보 없음";
    }
    return calculateRemainingMonitoringPeriod(endDate);
  })();

  const centerLocation =
    center?.location || adoption.center_location || "위치 정보 없음";
  const centerPhone = isCenterLoading
    ? "로딩 중..."
    : center?.phoneNumber || center?.centerNumber || "전화번호 정보 없음";
  const centerImage = center?.imageUrl ?? adoption.center_image_url;

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
            <h2 className="flex items-center text-center justify-center text-bk mb-6">
              아이와의 일상이 궁금해요!
              <br />
              주기적인 모니터링 부탁드려요
            </h2>

            {/* Progress Bar */}
            <DotProgressBar currentStep={5} className="mb-6" />
            <div className="mb-6">
              <h3 className="text-bk mb-1">모니터링 현황</h3>
              <div className="flex items-center gap-2">
                <h6 className="text-gr">
                  남은 기간 : {remainingMonitoringPeriod} 남았어요
                </h6>
              </div>
            </div>
            {/* Center Info */}
            <SectionLine>
              <CenterInfo
                variant="primary"
                centerId={adoption.center_id}
                name={adoption.center_name}
                location={centerLocation}
                phoneNumber={centerPhone}
                imageUrl={centerImage}
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
                  protection_status: "보호중" as const,
                  adoption_status: "입양완료" as const,
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
                          {user?.phoneNumber || "전화번호 정보 없음"}
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
              <BigButton
                variant="variant5"
                onClick={() => {
                  router.push(`/adoption/contract?adoptionId=${id}`);
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
