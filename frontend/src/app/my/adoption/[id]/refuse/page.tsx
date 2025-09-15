"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGetUserAdoptionDetail } from "@/hooks/query/useGetUserAdoptionDetail";
import { useAuth } from "@/components/providers/AuthProvider";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { CenterInfo } from "@/components/ui/CenterInfo";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../../_components/SectionLine";

export default function AdoptionRefusePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();

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

  const handleViewConsent = () => {
    // 동의서 보기 로직
    console.log("동의서 보기");
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
              <h4>자세히 보기</h4>
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
              <h4>자세히 보기</h4>
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
              <h4>자세히 보기</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              입양 신청이 거절되었어요
            </h2>
            {/* Info Card */}
            <InfoCard className="mb-6">
              신중한 논의를 통해 이루어진 결정으로, 향후에 더 좋은 아이를 만나
              뵐 수 있길 바라요.
            </InfoCard>

            {/* Center Info */}
            <SectionLine>
              <CenterInfo
                variant="primary"
                centerId={adoption.center_id}
                name={adoption.center_name}
                location={adoption.center_location || "위치 정보 없음"}
                phoneNumber="000-000-0000"
                imageUrl={adoption.center_image_url}
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
                  adoption_status: "입양가능" as const,
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
                onClick={handleViewConsent}
                className="w-full py-4"
              >
                동의서 보기
              </BigButton>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
