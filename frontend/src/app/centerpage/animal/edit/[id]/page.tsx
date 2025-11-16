"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import BasicInfo from "../../add/_components/BasicInfo";
import DetailInfo from "../../add/_components/DetailInfo";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { useUpdateAnimal, useUploadImages } from "@/hooks/mutation";
import { useGetAnimalById } from "@/hooks/query/useGetAnimals";

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
  };
  detailInfo: {
    personality: {
      activity: number;
      sensitivity: number;
      sociability: number;
      separationAnxiety: number;
    };
    sociality: {
      confidence: number;
      independence: number;
      physicalContact: number;
      handlingAcceptance: number;
      strangersAttitude: number;
      objectsAttitude: number;
      environmentAttitude: number;
      dogsAttitude: number;
    };
    separationAnxietyDetail: {
      copingAbility: number;
      playfulnessLevel: number;
      walkabilityLevel: number;
      groomingAcceptanceLevel: number;
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
      activity: 3,
      sensitivity: 3,
      sociability: 3,
      separationAnxiety: 3,
    },
    // 사회성 세부 항목들
    sociality: {
      confidence: 3,
      independence: 3,
      physicalContact: 3,
      handlingAcceptance: 3,
      strangersAttitude: 3,
      objectsAttitude: 3,
      environmentAttitude: 3,
      dogsAttitude: 3,
    },
    // 분리불안 세부 항목들
    separationAnxietyDetail: {
      copingAbility: 3,
      playfulnessLevel: 3,
      walkabilityLevel: 3,
      groomingAcceptanceLevel: 3,
    },

    trainerComment: "",
  },
  images: [],
};

export default function EditAnimal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const updateAnimalMutation = useUpdateAnimal();
  const uploadImagesMutation = useUploadImages();

  // 기존 동물 데이터 불러오기
  const { data: animalData, isLoading: isLoadingAnimal } = useGetAnimalById(
    resolvedParams.id
  );

  // 기존 데이터를 폼에 설정
  useEffect(() => {
    if (animalData) {
      setFormData({
        basicInfo: {
          name: animalData.name || "",
          protection_status: animalData.protection_status || "",
          adoption_status: animalData.adoption_status || "",
          breed: animalData.breed || "",
          age: animalData.age?.toString() || "",
          gender: animalData.is_female ? "암컷" : "수컷",
          neutering: "", // 이 정보는 API 응답에 없으므로 기본값 설정
          weight: animalData.weight?.toString() || "",
          foundLocation: animalData.found_location || "",
          personality: animalData.personality || "",
          specialNotes: animalData.special_notes || "",
          healthNotes: animalData.health_notes || "",
          centerEntryDate: animalData.admission_date || "",
          color: animalData.color || "",
        },
        detailInfo: {
          personality: {
            activity: animalData.activity_level || 3,
            sensitivity: animalData.sensitivity || 3,
            sociability: animalData.sociability || 3,
            separationAnxiety: animalData.separation_anxiety || 3,
          },
          // 사회성 세부 항목들
          sociality: {
            confidence: animalData.confidence || 3,
            independence: animalData.independence || 3,
            physicalContact: animalData.physical_contact || 3,
            handlingAcceptance: animalData.handling_acceptance || 3,
            strangersAttitude: animalData.strangers_attitude || 3,
            objectsAttitude: animalData.objects_attitude || 3,
            environmentAttitude: animalData.environment_attitude || 3,
            dogsAttitude: animalData.dogs_attitude || 3,
          },
          // 분리불안 세부 항목들
          separationAnxietyDetail: {
            copingAbility: animalData.coping_ability || 3,
            playfulnessLevel: animalData.playfulness_level || 3,
            walkabilityLevel: animalData.walkability_level || 3,
            groomingAcceptanceLevel: animalData.grooming_acceptance_level || 3,
          },

          trainerComment: animalData.trainer_comment || "",
        },
        images: [],
      });
    }
  }, [animalData]);

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
        id: resolvedParams.id, // 수정할 동물의 ID
        name: basicInfo.name,
        is_female: basicInfo.gender === "암컷",
        age: parseInt(basicInfo.age),
        weight: parseFloat(basicInfo.weight),
        color: basicInfo.color,
        breed: basicInfo.breed,
        description: basicInfo.personality || "",
        protection_status: basicInfo.protection_status,
        adoption_status: basicInfo.adoption_status,
        activity_level: detailInfo.personality.activity.toString(),
        sensitivity: detailInfo.personality.sensitivity.toString(),
        sociability: detailInfo.personality.sociability.toString(),
        separation_anxiety: detailInfo.personality.separationAnxiety.toString(),

        // 사회성 세부 항목들
        confidence: detailInfo.sociality.confidence.toString(),
        independence: detailInfo.sociality.independence.toString(),
        physical_contact: detailInfo.sociality.physicalContact.toString(),
        handling_acceptance: detailInfo.sociality.handlingAcceptance.toString(),
        strangers_attitude: detailInfo.sociality.strangersAttitude.toString(),
        objects_attitude: detailInfo.sociality.objectsAttitude.toString(),
        environment_attitude:
          detailInfo.sociality.environmentAttitude.toString(),
        dogs_attitude: detailInfo.sociality.dogsAttitude.toString(),

        // 분리불안 세부 항목들
        coping_ability:
          detailInfo.separationAnxietyDetail.copingAbility.toString(),
        playfulness_level:
          detailInfo.separationAnxietyDetail.playfulnessLevel.toString(),
        walkability_level:
          detailInfo.separationAnxietyDetail.walkabilityLevel.toString(),
        grooming_acceptance_level:
          detailInfo.separationAnxietyDetail.groomingAcceptanceLevel.toString(),

        special_notes: basicInfo.specialNotes || "",
        health_notes: basicInfo.healthNotes || "",
        trainer_comment: detailInfo.trainerComment || "",
        announce_number: null,
        admission_date: basicInfo.centerEntryDate || null,
        found_location: basicInfo.foundLocation || "",
        personality: basicInfo.personality || "",
      };

      const updatedAnimal = await updateAnimalMutation.mutateAsync(requestData);

      if (formData.images.length > 0) {
        await uploadImagesMutation.mutateAsync({
          postId: updatedAnimal.id,
          images: formData.images,
        });
      }

      router.push("/centerpage/animal");
    } catch (error) {
      console.error("동물 정보 수정 실패:", error);
      alert("동물 정보 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const isLoading =
    updateAnimalMutation.isPending ||
    uploadImagesMutation.isPending ||
    isLoadingAnimal;

  // 로딩 중이거나 데이터가 없는 경우
  if (isLoadingAnimal) {
    return (
      <Container className="min-h-screen bg-wh">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-b-2 rounded-full animate-spin border-brand"></div>
            <p>동물 정보를 불러오는 중...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!animalData) {
    return (
      <Container className="min-h-screen bg-wh">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p>동물 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </Container>
    );
  }

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
        right={<h6 className="text-gr">{/* 공공데이터 매칭 */}</h6>}
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
        variant="variant4"
        primaryButtonText="적용하기"
        onPrimaryButtonClick={handleSubmit}
        applyButtonDisabled={isLoading}
      />
    </Container>
  );
}
