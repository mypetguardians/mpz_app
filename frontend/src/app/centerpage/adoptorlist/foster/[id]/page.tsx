"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../_components/SectionLine";
import { useGetCenterAdoption } from "@/hooks";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { transformRawAnimalToPetCard } from "@/types/animal";

interface FosterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FosterDetailPage({ params }: FosterDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  // 개별 임시보호(입양) 신청 조회
  const { data: adoption, isLoading, error } = useGetCenterAdoption(id);

  // 동물 정보 조회
  const {
    data: animalData,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(adoption?.animal_id || "");

  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
    // 기존 입양 동의서 화면을 그대로 재사용
    router.push(`/centerpage/adoptorlist/application/${id}/consentform`);
  };

  if (isLoading || animalLoading) {
    return (
      <div className="min-h-screen bg-bg">
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
                <h4>로딩 중...</h4>
              </div>
            }
          />
          <div className="relative z-10 flex-1 -mt-4 bg-white rounded-t-3xl">
            <div className="p-4">
              <div className="py-8 text-center">로딩 중...</div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !adoption) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <div className="mb-2 text-red-500">
            임시보호 신청 데이터를 불러오는 중 오류가 발생했습니다
          </div>
          {error && (
            <div className="text-sm text-gray-500">{error.message}</div>
          )}
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

  const petCardData = animalData
    ? transformRawAnimalToPetCard(animalData)
    : null;

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
              <h4>{adoption.user_info.name}</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="relative z-10 flex-1 -mt-4 bg-white rounded-t-3xl">
          <div className="p-4 pb-24">
            {/* Pet Info */}
            <SectionLine>
              <h3 className="mb-3 text-bk">임시보호 동물</h3>
              {petCardData ? (
                <PetCard pet={petCardData} variant="variant4" />
              ) : (
                <div className="py-4 text-sm text-center text-gr">
                  동물 정보를 불러올 수 없습니다.
                </div>
              )}
            </SectionLine>

            <SectionLine>
              {/* Foster Information */}
              <div className="mb-6">
                <h3 className="mb-3 text-bk">임시보호자 정보</h3>
                <div className="p-4 bg-white rounded-lg">
                  <table className="w-full">
                    <tbody className="space-y-1">
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          이름
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoption.user_info.name}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          생년월일
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoption.user_info.birthDate}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          성별
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoption.user_info.gender}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          주소
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoption.user_info.address}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="w-20 py-1 pr-3 align-top text-gr h5">
                          전화번호
                        </td>
                        <td className="py-1 text-sm">
                          <div className="px-3 py-1">
                            {adoption.user_info.phone}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionLine>

            {/* Question Responses */}
            <SectionLine>
              <h3 className="mb-3 text-bk">폼 응답</h3>
              <div className="flex flex-col">
                {adoption.question_responses.length === 0 ? (
                  <div className="py-4 text-sm text-center text-gr">
                    폼 응답이 없습니다.
                  </div>
                ) : (
                  adoption.question_responses.map((response, index) => (
                    <div
                      key={index}
                      className="flex flex-col py-3 border-b border-bg"
                    >
                      <h5 className="text-gr">
                        {response.question_content ||
                          response.question ||
                          response.question_id ||
                          "질문"}
                      </h5>
                      <p className="body text-bk">{response.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionLine>

            {/* Action Buttons */}
            <BigButton
              variant="variant5"
              onClick={handleViewConsent}
              className="w-full py-4"
            >
              동의서 보기
            </BigButton>
          </div>
        </div>
      </Container>
    </div>
  );
}
