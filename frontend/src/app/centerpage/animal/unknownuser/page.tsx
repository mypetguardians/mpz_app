"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { KakaoButton } from "@/components/ui/KakaoButton";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";
import { useGetCenterById } from "@/hooks/query/useGetCenters";

function UnknownUserAddContent() {
  const searchParams = useSearchParams();
  const animalId = searchParams.get("animalId");
  const centerId = searchParams.get("centerId");

  // 동물 정보 가져오기
  const {
    data: animal,
    isLoading: animalLoading,
    error: animalError,
  } = useGetAnimalById(animalId || "");

  // 보호센터 정보 가져오기
  const {
    data: center,
    isLoading: centerLoading,
    error: centerError,
  } = useGetCenterById(centerId || animal?.center_id);

  // 로딩 상태 처리
  if (animalLoading || centerLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="primary"
          left={
            <Link href="/">
              <span className="font-bold text-brand cursor-pointer">logo</span>
            </Link>
          }
        />
        <div className="flex flex-col justify-center items-center py-[98px] mx-auto">
          <div className="text-center">로딩 중...</div>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (animalError || centerError) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="primary"
          left={
            <Link href="/">
              <span className="font-bold text-brand cursor-pointer">logo</span>
            </Link>
          }
        />
        <div className="flex flex-col justify-center items-center py-[98px] mx-auto">
          <div className="text-center text-red-500">
            정보를 불러오는데 실패했습니다
          </div>
        </div>
      </Container>
    );
  }

  // 데이터가 없는 경우
  if (!animal || !center) {
    return (
      <Container className="min-h-screen">
        <TopBar
          variant="primary"
          left={
            <Link href="/">
              <span className="font-bold text-brand cursor-pointer">logo</span>
            </Link>
          }
        />
        <div className="flex flex-col justify-center items-center py-[98px] mx-auto">
          <div className="text-center text-red-500">
            동물 또는 보호센터 정보를 찾을 수 없습니다
          </div>
        </div>
      </Container>
    );
  }

  // 동물 이미지 URL (첫 번째 이미지 사용)
  const animalImageUrl =
    animal.animal_images && animal.animal_images.length > 0
      ? animal.animal_images[0]
      : "/img/dummyImg.jpeg";

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="primary"
        left={
          <Link href="/">
            <span className="font-bold text-brand cursor-pointer">logo</span>
          </Link>
        }
      />
      <div className="flex flex-col justify-center items-center py-[98px] mx-auto">
        <div className="flex flex-col justify-center items-center gap-1 text-bk mb-6">
          <h4>[{center.name}]</h4>
          <h4>{animal.name || "이름 없음"} 입양신청서</h4>
        </div>
        <Image
          src={animalImageUrl as string}
          alt={`${animal.name || "동물"} 이미지`}
          width={134}
          height={134}
          className="mb-9 w-[134px] h-[134px] object-cover"
        />
        <h5 className="text-gr mb-[49px] text-center">
          신청서 작성을 위해 <br />
          로그인 및 본인인증이 필요해요
        </h5>
        <KakaoButton />
      </div>
    </Container>
  );
}

export default function UnknownUserAdd() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnknownUserAddContent />
    </Suspense>
  );
}
