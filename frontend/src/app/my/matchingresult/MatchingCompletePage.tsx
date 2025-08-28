"use client";

import Image from "next/image";
import { X, ShareNetwork, ArrowClockwise } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";

import { IconButton } from "@/components/ui/IconButton";
import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { PetCard } from "@/components/ui/PetCard";
import { BigButton } from "@/components/ui/BigButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetInfo, mainPetInfo } from "@/app/mock";

// 매칭 결과 타입 정의
type MatchingResultType =
  | "perfect" // 완벽한 매칭
  | "good" // 좋은 매칭
  | "moderate" // 적당한 매칭
  | "silent"; // 조용한

// 매칭 결과별 데이터
const matchingResults = {
  perfect: {
    message: "당신 같은 보호자가 있다는 게\n얼마나 든든한지 몰라요.",
    subtitle:
      "어려움이 있었던 아이들도 당신 곁에서\n안정감을 찾을 수 있을 거예요.",
    image: "/illust/result01.svg",
    imageAlt: "결과1 일러스트",
  },
  good: {
    message: "반려동물과의 삶은 소중하지만 \n쉬운 일만은 아니에요.",
    subtitle:
      "배변훈련, 건강관리, 예상치 못한 병원비까지...\n함께 잘 할 수 있을까?\n스스로에게 한번 더 물어봐주세요\n충분히 고민해보고, 여유가 생겼을 때 다시 만나는 것도 괜찮아요.",
    image: "/illust/result02.svg",
    imageAlt: "결과2 일러스트",
  },
  moderate: {
    message: "당신의 에너지가\n누군가에게 큰 선물이 될 수 있어요.",
    subtitle:
      "함께 달리고, 함께 배우고, \n매일을 모험처럼 살아가는 걸 좋아하는 아이가 있어요.\n활기찬 하루를 함께 나눌 친구를 소개해드릴게요.",
    image: "/illust/result03.svg",
    imageAlt: "결과3 일러스트",
  },
  silent: {
    message: "조용한 일상을 즐기는 당신\n그리고 그런 아이들이 있어요.",
    subtitle:
      "낯선 세상에 쉽게 지치는 아이들도\n당신의 차분한 생활 속에서 마음을 놓을 수 있을거에요.\n서로의 속도를 존중하는 따듯한 만남, 함께 만들어볼까요?",
    image: "/illust/result04.svg",
    imageAlt: "결과4 일러스트",
  },
};

// 매칭된 동물 목록 데이터 (mock 데이터의 처음 5개 사용)
const matchedPets: PetInfo[] = mainPetInfo.slice(0, 5);

// 매칭 결과 컴포넌트
function MatchingResult({ type }: { type: MatchingResultType }) {
  const result = matchingResults[type];

  return (
    <div className="flex flex-col gap-2 items-center">
      <h6 className="text-brand">username 님의 매칭 결과</h6>
      <h2 className="text-bk text-center">
        {result.message.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            {index < result.message.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h2>
      <h6 className="text-dg text-center">
        {result.subtitle.split("\n").map((line, index) => (
          <span key={index}>
            {line}
            {index < result.subtitle.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h6>
    </div>
    // here
  );
}

// 매칭된 동물 목록 컴포넌트
function MatchedPetsList() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-start mb-4">
        <h2 className="text-bk text-xl font-bold mb-2">
          UserName 님과
          <br />꼭 맞는 아이들이에요!
        </h2>
        <p className="text-dg text-sm">결과는 매일 업데이트 돼요.</p>
      </div>

      <div className="flex flex-col gap-3">
        {matchedPets.map((pet, index) => (
          <PetCard
            key={pet.id}
            pet={{
              id: pet.id,
              name: pet.name || "",
              breed: pet.color || "",
              isFemale: pet.isFemale,
              status: pet.tag as
                | "보호중"
                | "입양완료"
                | "무지개다리"
                | "임시보호중"
                | "반환"
                | "방사",
              centerId: pet.center,
              animalImages: pet.imageUrls.map((url, idx) => ({
                id: `${pet.id}-${idx}`,
                imageUrl: url,
                orderIndex: idx,
              })),
              foundLocation: pet.foundLocation || "",
            }}
            variant="detail"
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

// 매칭 결과 이미지 컴포넌트
function MatchingResultImage({ type }: { type: MatchingResultType }) {
  const result = matchingResults[type];

  return (
    <div className="flex justify-center">
      <Image
        src={result.image}
        alt={result.imageAlt}
        width={330}
        height={240}
        className="object-contain"
        priority
      />
    </div>
  );
}

export default function MatchingCompletePage() {
  const searchParams = useSearchParams();
  const matchingTypeParam = searchParams.get("type") as MatchingResultType;

  // URL 파라미터가 없거나 유효하지 않은 경우 기본값 사용
  const matchingType: MatchingResultType =
    matchingTypeParam && matchingResults[matchingTypeParam]
      ? matchingTypeParam
      : "perfect";

  return (
    <Container className="min-h-screen flex flex-col bg-gradient-to-b from-brand-light/10 to-transparent">
      <TopBar
        variant="variant6"
        right={
          <IconButton
            icon={({ size }) => <X size={size} weight="bold" />}
            size="iconM"
          />
        }
      />
      <div className="flex flex-col px-4 py-20 items-center gap-9">
        <MatchingResult type={matchingType} />
        <MatchingResultImage type={matchingType} />
        <MatchedPetsList />

        <div className="flex flex-col gap-3 w-full mt-8">
          <BigButton
            variant="variant5"
            left={<ShareNetwork size={20} />}
            className="w-full py-4"
          >
            결과 공유하기
          </BigButton>
          <div className="flex justify-center">
            <MiniButton
              text="다시 해보기"
              leftIcon={<ArrowClockwise size={16} />}
              variant="primary"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
