"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import BasicInfo from "./_components/BasicInfo";
import DetailInfo from "./_components/DetailInfo";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { useCreateAnimal, useUploadImages } from "@/hooks/mutation";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";

interface FormData {
  basicInfo: {
    name: string;
    protection_status: string;
    adoption_status: string;
    breed: string;
    age: string;
    gender: string;
    neutering: string;
    weight: string;
    foundLocation: string;
    personality: string;
    specialNotes: string;
    healthNotes: string;
    centerEntryDate: string;
    color: string;
    imageUrls?: string[]; // 업로드된 이미지 URL들
  };
  detailInfo: {
    personality: {
      activity: number;
      sensitivity: number;
      sociability: number;
      separationAnxiety: number;
    };
    trainerComment: string;
  };
  images: File[];
}

const initialFormData: FormData = {
  basicInfo: {
    name: "",
    protection_status: "",
    adoption_status: "",
    breed: "",
    age: "",
    gender: "",
    neutering: "",
    weight: "",
    foundLocation: "",
    personality: "",
    specialNotes: "",
    healthNotes: "",
    centerEntryDate: "",
    color: "",
  },
  detailInfo: {
    personality: {
      activity: 1,
      sensitivity: 1,
      sociability: 1,
      separationAnxiety: 1,
    },
    trainerComment: "",
  },
  images: [],
};

export default function AddAnimal() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const createAnimalMutation = useCreateAnimal();
  const uploadImagesMutation = useUploadImages();
  const { data: myCenter } = useGetMyCenter();

  const isSubscriber = myCenter?.isSubscriber === true;

  const handleBack = () => {
    router.back();
  };

  const handleBasicInfoChange = (data: Partial<FormData["basicInfo"]>) => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...data },
    }));
  };

  const handleDetailInfoChange = (data: Partial<FormData["detailInfo"]>) => {
    setFormData((prev) => ({
      ...prev,
      detailInfo: { ...prev.detailInfo, ...data },
    }));
  };

  const handleImagesChange = (images: File[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    // 필수 필드 검증
    const { basicInfo, detailInfo } = formData;

    if (
      !basicInfo.name ||
      !basicInfo.protection_status ||
      !basicInfo.adoption_status ||
      !basicInfo.breed ||
      !basicInfo.age ||
      !basicInfo.gender ||
      !basicInfo.neutering ||
      !basicInfo.weight ||
      !basicInfo.color
    ) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    try {
      const requestData = {
        name: basicInfo.name,
        is_female: basicInfo.gender === "암컷",
        age: parseInt(basicInfo.age),
        weight: parseFloat(basicInfo.weight),
        color: basicInfo.color,
        breed: basicInfo.breed,
        description: basicInfo.personality || "",
        protection_status: basicInfo.protection_status as
          | "보호중"
          | "안락사"
          | "자연사"
          | "반환",
        adoption_status: basicInfo.adoption_status as
          | "입양가능"
          | "입양진행중"
          | "입양완료"
          | "입양불가",
        activity_level: detailInfo.personality.activity,
        sensitivity: detailInfo.personality.sensitivity,
        sociability: detailInfo.personality.sociability,
        separation_anxiety: detailInfo.personality.separationAnxiety,
        special_notes: basicInfo.specialNotes || "",
        health_notes: basicInfo.healthNotes || "",
        basic_training: "",
        trainer_comment: detailInfo.trainerComment || "",
        announce_number: "",
        announcement_date: basicInfo.centerEntryDate || undefined,
        found_location: basicInfo.foundLocation || "",
        personality: basicInfo.personality || "",
        // 업로드된 이미지 URL들 포함
        image_urls: basicInfo.imageUrls || [],
      };

      const createdAnimal = await createAnimalMutation.mutateAsync(requestData);

      // BasicInfo에서 이미 이미지가 업로드되었으므로 중복 업로드 제거
      // 만약 로컬 파일이 남아있다면 (업로드되지 않은 이미지) 추가 업로드
      const unuploadedImages = formData.images.filter(
        (_, index) => !basicInfo.imageUrls || !basicInfo.imageUrls[index]
      );

      if (unuploadedImages.length > 0) {
        console.log(`${unuploadedImages.length}개의 추가 이미지 업로드 중...`);
        await uploadImagesMutation.mutateAsync({
          postId: createdAnimal.id,
          images: unuploadedImages,
        });
      }

      console.log("동물 등록 완료, 리스트 페이지로 이동");
      router.push("/centerpage/animal");
    } catch (error) {
      console.error("동물 등록 실패:", error);
      alert("동물 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const isLoading =
    createAnimalMutation.isPending || uploadImagesMutation.isPending;

  return (
    <Container className="min-h-screen bg-wh">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>새로운 아이 업로드</h4>
          </div>
        }
        right={<h6 className="text-gr">공공데이터 매칭</h6>}
      />
      <div className="mb-20">
        <BasicInfo
          data={formData.basicInfo}
          onChange={handleBasicInfoChange}
          images={formData.images}
          onImagesChange={handleImagesChange}
        />
        {isSubscriber && (
          <DetailInfo
            data={formData.detailInfo}
            onChange={handleDetailInfoChange}
          />
        )}
      </div>
      <FixedBottomBar
        variant="variant2"
        resetButtonText="재설정"
        resetButtonLeft={<ArrowsClockwise />}
        onResetButtonClick={handleReset}
        applyButtonText="적용하기"
        onApplyButtonClick={handleSubmit}
        applyButtonDisabled={isLoading}
      />
    </Container>
  );
}
