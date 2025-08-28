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

interface FormData {
  basicInfo: {
    status: string;
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
    status: "",
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
      !basicInfo.status ||
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
        name: basicInfo.breed,
        is_female: basicInfo.gender === "암컷",
        age: parseInt(basicInfo.age),
        weight: parseFloat(basicInfo.weight),
        color: basicInfo.color,
        breed: basicInfo.breed,
        description: basicInfo.personality || "",
        status: basicInfo.status as
          | "보호중"
          | "입양완료"
          | "무지개다리"
          | "임시보호중"
          | "반환"
          | "방사",
        activity_level: detailInfo.personality.activity,
        sensitivity: detailInfo.personality.sensitivity,
        sociability: detailInfo.personality.sociability,
        separation_anxiety: detailInfo.personality.separationAnxiety,
        special_notes: basicInfo.specialNotes || "",
        health_notes: basicInfo.healthNotes || "",
        basic_training: "",
        trainer_comment: detailInfo.trainerComment || "",
        announce_number: "",
        announcement_date: "",
        found_location: basicInfo.foundLocation || "",
        personality: basicInfo.personality || "",
      };

      const createdAnimal = await createAnimalMutation.mutateAsync(requestData);

      if (formData.images.length > 0) {
        await uploadImagesMutation.mutateAsync({
          postId: createdAnimal.id,
          images: formData.images,
        });
      }

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
        <DetailInfo
          data={formData.detailInfo}
          onChange={handleDetailInfoChange}
        />
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
