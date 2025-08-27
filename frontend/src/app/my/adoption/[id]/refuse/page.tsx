"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { InfoCard } from "@/components/ui/InfoCard";
import CenterInfo from "@/components/ui/CenterInfo";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { SectionLine } from "../../_components/SectionLine";
import {
  mainPetInfo,
  CenterInfo as CenterInfoData,
  user,
  adoptionResponses,
} from "@/app/mock";

export default function AdoptionRefusePage() {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(true);

  const handleBack = () => {
    router.push("/my/adoption");
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

  const handleViewConsent = () => {
    // 동의서 보기 로직
    console.log("동의서 보기");
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
              <h4>자세히 보기</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            <h2 className="flex itemx-center justify-center text-bk mb-6">
              입양 신청이 거절되었습니다
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
                name={CenterInfoData[0].name}
                location={CenterInfoData[0].location}
                phoneNumber={CenterInfoData[0].phoneNumber || "000-000-0000"}
                isFavorite={isFavorite}
                onFavoriteToggle={handleFavoriteToggle}
                className="mb-6"
              />
            </SectionLine>

            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">입양 신청 동물</h3>
              <PetCard pet={mainPetInfo[0]} variant="variant4" />
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
              <h3 className="text-bk mb-3">내 응답</h3>
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
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
