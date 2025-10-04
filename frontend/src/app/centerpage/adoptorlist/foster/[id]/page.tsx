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
import RelatedPosts from "@/app/list/animal/[id]/_components/RelatedPosts";
import { mainPetInfo, user, adoptionResponses } from "@/app/mock";

export default function AdoptorlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const animal = mainPetInfo.find((item) => item.id === id);

  const handleBack = () => {
    router.back();
  };

  const handleViewConsent = () => {
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
              <h4>UserName</h4>
            </div>
          }
        />

        {/* Main Content */}
        <div className="flex-1 bg-white rounded-t-3xl -mt-4 relative z-10">
          <div className="p-4">
            {/* Pet Info */}
            <SectionLine>
              <h3 className="text-bk mb-3">임시보호 동물</h3>
              <PetCard
                pet={{
                  id: mainPetInfo[0].id,
                  name: mainPetInfo[0].name,
                  breed: mainPetInfo[0].tag,
                  isFemale: mainPetInfo[0].isFemale,
                  protection_status: "보호중" as const,
                  adoption_status: "입양가능" as const,
                  centerId: "1",
                  animalImages: mainPetInfo[0].imageUrls.map((url, index) => ({
                    id: index.toString(),
                    imageUrl: url,
                    orderIndex: index,
                  })),
                  foundLocation: mainPetInfo[0].foundLocation,
                }}
                variant="variant4"
              />
            </SectionLine>

            {animal && (
              <RelatedPosts
                currentPet={{
                  id: animal.id,
                  name: animal.name,
                  breed: animal.tag,
                  isFemale: animal.isFemale,
                  status: animal.tag === "보호중" ? "보호중" : "임시보호중",
                  protection_status: "보호중" as const,
                  adoption_status: "입양가능" as const,
                  age: animal.age || 0,
                  weight: animal.weight || null,
                  color: animal.color || null,
                  description: animal.description || null,
                  waitingDays: animal.waitingDays || null,
                  activityLevel: animal.activityLevel?.toString() || null,
                  sensitivity: animal.sensitivity?.toString() || null,
                  sociability: animal.sociability?.toString() || null,
                  separationAnxiety: null,
                  specialNotes: null,
                  healthNotes: null,
                  basicTraining: null,
                  trainerName: null,
                  trainerComment: null,
                  announceNumber: null,
                  announcementDate: null,
                  noticeStartDate: null,
                  noticeEndDate: null,
                  admissionDate: null,
                  foundLocation: animal.foundLocation || null,
                  personality: null,
                  megaphoneCount: 0,
                  isMegaphoned: false,
                  centerId: "1",
                  animalImages:
                    animal.imageUrls?.map((url, index) => ({
                      id: index.toString(),
                      imageUrl: url,
                      orderIndex: index,
                    })) || null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                title="임시보호자가 올린 글"
              />
            )}

            <SectionLine>
              {/* My Information */}
              <div className="mb-6">
                <h3 className="text-bk mb-3">임시보호자 정보</h3>
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
              <h3 className="text-bk mb-3">폼 응답</h3>
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
