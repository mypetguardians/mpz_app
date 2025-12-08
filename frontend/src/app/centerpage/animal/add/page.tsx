"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { BottomSheet } from "@/components/ui";
import BasicInfo from "./_components/BasicInfo";
import DetailInfo from "./_components/DetailInfo";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { useCreateAnimal, useUploadImages } from "@/hooks/mutation";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";
import { useAuth } from "@/components/providers/AuthProvider";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useToast } from "@/hooks/useToast";

interface FormData {
  basicInfo: {
    name: string;
    protection_status: string;
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
    // 사회성 세부 항목들
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
    // 분리불안 세부 항목들
    separationAnxietyDetail: {
      copingAbility: number;
      playfulnessLevel: number;
      walkabilityLevel: number;
      groomingAcceptanceLevel: number;
    };
    trainerComment: string;
    createdAt?: string;
    updatedAt?: string;
  };
  images: File[];
}

const initialFormData: FormData = {
  basicInfo: {
    name: "",
    protection_status: "",
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
    createdAt: undefined,
    updatedAt: undefined,
  },
  images: [],
};

export default function AddAnimal() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const isBlockingInstalledRef = useRef(false);
  const popstateHandlerRef = useRef<((e: PopStateEvent) => void) | null>(null);
  const beforeUnloadHandlerRef = useRef<
    ((e: BeforeUnloadEvent) => void) | null
  >(null);
  const createAnimalMutation = useCreateAnimal();
  const uploadImagesMutation = useUploadImages();
  const { data: myCenter } = useGetMyCenter();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const isTrainer = user?.userType === "훈련사";
  const isSubscriber = myCenter?.isSubscriber === true;
  const [uploadingImageIndexes, setUploadingImageIndexes] = useState<
    Set<number>
  >(new Set());

  // 폼 수정 여부 감지
  const isDirty = useMemo(() => {
    const b = formData.basicInfo;
    const d = formData.detailInfo;
    const hasBasic =
      !!b.name ||
      !!b.protection_status ||
      !!b.breed ||
      !!b.age ||
      !!b.gender ||
      !!b.neutering ||
      !!b.weight ||
      !!b.foundLocation ||
      !!b.personality ||
      !!b.specialNotes ||
      !!b.healthNotes ||
      !!b.centerEntryDate ||
      !!b.color;
    const hasDetail =
      d.personality.activity !==
        initialFormData.detailInfo.personality.activity ||
      d.personality.sensitivity !==
        initialFormData.detailInfo.personality.sensitivity ||
      d.personality.sociability !==
        initialFormData.detailInfo.personality.sociability ||
      d.personality.separationAnxiety !==
        initialFormData.detailInfo.personality.separationAnxiety ||
      d.sociality.confidence !==
        initialFormData.detailInfo.sociality.confidence ||
      d.sociality.independence !==
        initialFormData.detailInfo.sociality.independence ||
      d.sociality.physicalContact !==
        initialFormData.detailInfo.sociality.physicalContact ||
      d.sociality.handlingAcceptance !==
        initialFormData.detailInfo.sociality.handlingAcceptance ||
      d.sociality.strangersAttitude !==
        initialFormData.detailInfo.sociality.strangersAttitude ||
      d.sociality.objectsAttitude !==
        initialFormData.detailInfo.sociality.objectsAttitude ||
      d.sociality.environmentAttitude !==
        initialFormData.detailInfo.sociality.environmentAttitude ||
      d.sociality.dogsAttitude !==
        initialFormData.detailInfo.sociality.dogsAttitude ||
      d.separationAnxietyDetail.copingAbility !==
        initialFormData.detailInfo.separationAnxietyDetail.copingAbility ||
      d.separationAnxietyDetail.playfulnessLevel !==
        initialFormData.detailInfo.separationAnxietyDetail.playfulnessLevel ||
      d.separationAnxietyDetail.walkabilityLevel !==
        initialFormData.detailInfo.separationAnxietyDetail.walkabilityLevel ||
      d.separationAnxietyDetail.groomingAcceptanceLevel !==
        initialFormData.detailInfo.separationAnxietyDetail
          .groomingAcceptanceLevel ||
      !!d.trainerComment;
    const hasImages = formData.images.length > 0;
    return hasBasic || hasDetail || hasImages;
  }, [formData]);

  // 브라우저 뒤로가기 제스처/버튼(popstate) 및 새로고침/닫기(beforeunload) 차단
  useEffect(() => {
    const installBlockers = () => {
      if (isBlockingInstalledRef.current) return;
      // 현재 페이지 상태를 한 단계 쌓아 뒤로가기를 가로챔
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", window.location.href);
      }
      const onPopState = () => {
        // 커스텀 바텀시트 노출
        setShowBackConfirmSheet(true);
        // 다시 현재 상태를 쌓아 실제 이동을 막음
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", window.location.href);
        }
      };
      const onBeforeUnload = (e: BeforeUnloadEvent) => {
        // 하드 새로고침/창 닫기는 네이티브 확인창만 가능
        e.preventDefault();
        e.returnValue = "";
      };
      window.addEventListener("popstate", onPopState);
      window.addEventListener("beforeunload", onBeforeUnload);
      popstateHandlerRef.current = onPopState;
      beforeUnloadHandlerRef.current = onBeforeUnload;
      isBlockingInstalledRef.current = true;
    };

    const removeBlockers = () => {
      if (!isBlockingInstalledRef.current) return;
      if (popstateHandlerRef.current) {
        window.removeEventListener("popstate", popstateHandlerRef.current);
        popstateHandlerRef.current = null;
      }
      if (beforeUnloadHandlerRef.current) {
        window.removeEventListener(
          "beforeunload",
          beforeUnloadHandlerRef.current
        );
        beforeUnloadHandlerRef.current = null;
      }
      isBlockingInstalledRef.current = false;
    };

    if (isDirty) {
      installBlockers();
    } else {
      removeBlockers();
    }

    return () => {
      // 언마운트 시 항상 정리
      if (popstateHandlerRef.current) {
        window.removeEventListener("popstate", popstateHandlerRef.current);
        popstateHandlerRef.current = null;
      }
      if (beforeUnloadHandlerRef.current) {
        window.removeEventListener(
          "beforeunload",
          beforeUnloadHandlerRef.current
        );
        beforeUnloadHandlerRef.current = null;
      }
      isBlockingInstalledRef.current = false;
    };
  }, [isDirty]);

  const handleBack = () => {
    setShowBackConfirmSheet(true);
  };

  const handleCancelBack = () => {
    setShowBackConfirmSheet(false);
  };

  const handleConfirmBack = () => {
    setShowBackConfirmSheet(false);
    // 차단 해제 후 실제로 이동
    if (popstateHandlerRef.current) {
      window.removeEventListener("popstate", popstateHandlerRef.current);
      popstateHandlerRef.current = null;
    }
    if (beforeUnloadHandlerRef.current) {
      window.removeEventListener(
        "beforeunload",
        beforeUnloadHandlerRef.current
      );
      beforeUnloadHandlerRef.current = null;
    }
    isBlockingInstalledRef.current = false;
    router.push("/centerpage/animal");
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

  // 이미지 추가 시 자동 업로드
  const handleImageAdd = async (newFiles: File[]) => {
    const currentImages = formData.images;
    const startIndex = currentImages.length;

    // 새 이미지를 images 배열에 추가
    const updatedImages = [...currentImages, ...newFiles];
    setFormData((prev) => ({ ...prev, images: updatedImages }));

    // 각 새 이미지를 순차적으로 업로드
    for (
      let relativeIndex = 0;
      relativeIndex < newFiles.length;
      relativeIndex++
    ) {
      const file = newFiles[relativeIndex];
      const absoluteIndex = startIndex + relativeIndex;
      setUploadingImageIndexes((prev) => new Set(prev).add(absoluteIndex));

      try {
        const res = await uploadImagesMutation.mutateAsync({
          postId: "new",
          images: [file],
        });

        if (res.images && res.images.length > 0) {
          // 업로드된 URL을 basicInfo.imageUrls에 추가
          setFormData((prev) => ({
            ...prev,
            basicInfo: {
              ...prev.basicInfo,
              imageUrls: [...(prev.basicInfo.imageUrls || []), res.images[0]],
            },
            // 업로드 완료된 이미지는 images 배열에서 제거
            images: prev.images.filter((_, i) => i !== absoluteIndex),
          }));
        }
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        showToast("이미지 업로드에 실패했습니다.", "error");
        // 실패한 이미지는 images 배열에서 제거
        setFormData((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== absoluteIndex),
        }));
      } finally {
        setUploadingImageIndexes((prev) => {
          const next = new Set(prev);
          next.delete(absoluteIndex);
          return next;
        });
      }
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    if (isLoading || uploadingImageIndexes.size > 0) {
      if (uploadingImageIndexes.size > 0) {
        showToast(
          "이미지 업로드가 진행 중입니다. 잠시만 기다려주세요.",
          "error"
        );
      }
      return;
    }
    // 필수 필드 검증
    const { basicInfo, detailInfo } = formData;

    if (
      !basicInfo.name ||
      !basicInfo.protection_status ||
      !basicInfo.breed ||
      !basicInfo.age ||
      !basicInfo.gender ||
      !basicInfo.neutering ||
      !basicInfo.weight
    ) {
      showToast("필수 항목을 모두 입력해주세요.", "error");
      return;
    }

    try {
      // 이미 업로드된 이미지 URL 사용 (이미지 업로드는 이미 완료됨)
      const uploadedImageUrls = basicInfo.imageUrls || [];
      const requestData = {
        name: basicInfo.name,
        is_female: basicInfo.gender === "암컷",
        neutering: basicInfo.neutering === "했어요",
        age: parseInt(basicInfo.age),
        weight: parseFloat(basicInfo.weight),
        color: basicInfo.color,
        breed: basicInfo.breed,
        description: basicInfo.personality || "",
        protection_status: basicInfo.protection_status as
          | "보호중"
          | "임시보호"
          | "안락사"
          | "자연사"
          | "반환"
          | "기증"
          | "방사"
          | "입양완료",
        adoption_status: "입양가능" as
          | "입양가능"
          | "입양진행중"
          | "입양완료"
          | "입양불가",
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
        basic_training: "",
        trainer_comment: detailInfo.trainerComment || "",
        image_urls: uploadedImageUrls,
        announce_number: "",
        announcement_date: basicInfo.centerEntryDate || undefined,
        found_location: basicInfo.foundLocation || "",
        personality: basicInfo.personality || "",
      };

      await createAnimalMutation.mutateAsync(requestData);

      router.push("/centerpage/animal");
    } catch (error) {
      console.error("동물 등록 실패:", error);
      showToast("동물 등록에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  const isLoading = createAnimalMutation.isPending;

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
            <h4>동물 정보 업로드</h4>
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
          onImageAdd={handleImageAdd}
          uploadingImageIndexes={uploadingImageIndexes}
        />
        {isSubscriber && isTrainer && (
          <DetailInfo
            data={formData.detailInfo}
            onChange={handleDetailInfoChange}
            canEdit={isSubscriber && isTrainer}
          />
        )}
      </div>
      <FixedBottomBar
        variant="variant4"
        onResetButtonClick={handleReset}
        primaryButtonText={isLoading ? "등록중 ..." : "등록하기"}
        onPrimaryButtonClick={handleSubmit}
        applyButtonDisabled={isLoading}
      />
      <BottomSheet
        open={showBackConfirmSheet}
        onClose={handleCancelBack}
        variant="primary"
        title="창을 닫으면 저장되지 않아요!"
        description="작성한 내용은 저장 및 복구가 불가능해요."
        leftButtonText="취소"
        rightButtonText="괜찮아요"
        onLeftClick={handleCancelBack}
        onRightClick={handleConfirmBack}
      />
      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </Container>
  );
}
