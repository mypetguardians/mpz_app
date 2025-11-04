"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CustomInput } from "@/components/ui/CustomInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CustomModal } from "@/components/ui/CustomModal";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { PetCard } from "@/components/ui/PetCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { ImageCard } from "@/components/ui/ImageCard";
import {
  ArrowLeft,
  X,
  ArrowDownLeft,
  Globe,
  LockSimple,
} from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import {
  useCreatePost,
  useGetUserAdoptions,
  useGetAnimalFavorites,
  useUploadImages,
} from "@/hooks";
import { useGetSystemTags } from "@/hooks";
import { useToast } from "@/hooks/useToast";
import { NotificationToast } from "@/components/ui/NotificationToast";
import type { PetCardAnimal } from "@/types/animal";
import type { UserAdoptionOut } from "@/types/adoption";

// PetCardAnimal을 확장한 타입 (adoptionId 포함)
type ExtendedPetCardAnimal = PetCardAnimal & { adoptionId?: string };

type PublicType = "center" | "public";

const uploadFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
});

export default function CommunityUploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPet, setSelectedPet] = useState<ExtendedPetCardAnimal | null>(
    null
  );

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const { data: systemTags } = useGetSystemTags();

  // blob URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 컴포넌트 unmount 시 모든 blob URL 해제
      uploadedImageUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [uploadedImageUrls]);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const { mutate: createPost, isPending } = useCreatePost();
  const { mutate: uploadImages } = useUploadImages();

  const { user } = useAuth();
  const isAdmin = user?.userType !== "일반사용자";
  const { showToast, hideToast, toast } = useToast();

  // 사용자 타입에 따라 초기 공개 범위를 지정 - 센터 계정은 항상 전체공개
  useEffect(() => {
    if (!user) return;
    setPublicType(isAdmin ? "public" : "public");
  }, [isAdmin, user]);

  const { data: adoptionsData } = useGetUserAdoptions({
    filters: {
      status: undefined,
    },
  });

  // 입양 이력이 존재하는지 여부 (상태 무관: 진행/완료 포함)
  const hasAnyAdoptions = useMemo(() => {
    const adoptionsArray =
      (adoptionsData as { data?: UserAdoptionOut[] })?.data || adoptionsData;
    if (!adoptionsArray || !Array.isArray(adoptionsArray)) return false;

    return adoptionsArray.length > 0;
  }, [adoptionsData]);

  const adoptionAnimals = useMemo(() => {
    const adoptionsArray =
      (adoptionsData as { data?: UserAdoptionOut[] })?.data || adoptionsData;
    if (!adoptionsArray || !Array.isArray(adoptionsArray)) return [];

    // PetCardAnimal 형태로 변환
    const transformedAnimals = adoptionsArray.map((adoption) => ({
      id: adoption.animal_id,
      name: adoption.animal_name,
      breed: adoption.animal_breed,
      isFemale: adoption.animal_is_female,
      protection_status: "보호중",
      adoption_status: "입양진행중",
      centerId: adoption.center_id,
      animalImages: adoption.animal_image
        ? [
            {
              id: "1",
              imageUrl: adoption.animal_image,
              orderIndex: 1,
            },
          ]
        : undefined,
      foundLocation: adoption.center_location || "위치 정보 확인 불가",
      adoptionId: adoption.id, // adoption ID 추가
    }));

    return transformedAnimals as PetCardAnimal[];
  }, [adoptionsData]);

  // 찜한 동물 목록
  const { data: favoriteAnimalsData } = useGetAnimalFavorites(1, 100);

  type FavoriteAnimalItem = {
    id: string;
    name: string;
    breed: string | null;
    isFemale: boolean;
    protection_status?: PetCardAnimal["protection_status"];
    adoption_status?: PetCardAnimal["adoption_status"];
    centerId: string;
    foundLocation?: string | null;
    found_location?: string | null;
    animalImages?: string[];
  };

  const favoriteAnimals = useMemo(() => {
    if (!favoriteAnimalsData?.animals) return [];

    const transformed = (
      favoriteAnimalsData.animals as FavoriteAnimalItem[]
    ).map((fav) => {
      const imageObjs = Array.isArray(fav.animalImages)
        ? fav.animalImages.map((url, index) => ({
            id: `img-${index}`,
            imageUrl: url,
            orderIndex: index,
          }))
        : [];

      return {
        id: fav.id,
        name: fav.name,
        breed: fav.breed ?? null,
        isFemale: fav.isFemale,
        protection_status: fav.protection_status || "보호중",
        adoption_status: fav.adoption_status || "입양가능",
        centerId: fav.centerId,
        animalImages: imageObjs,
        foundLocation:
          fav.foundLocation || fav.found_location || "위치 정보 확인 불가",
      } as PetCardAnimal;
    });

    return transformed;
  }, [favoriteAnimalsData]);

  // 현재 활성 탭에 따른 동물 목록
  const animals = useMemo(() => {
    const result = activeTab === "adoption" ? adoptionAnimals : favoriteAnimals;
    return result;
  }, [activeTab, adoptionAnimals, favoriteAnimals]);

  // 현재 활성 탭에 따른 페이지네이션 정보
  const hasNextPage = false;
  const isFetchingNextPage = false;
  const fetchNextPage = () => {};

  const handleImageUpload = (files: File[]) => {
    if (files.length === 0) return;

    // 최대 5개 제한 확인
    const currentCount = uploadedFiles.length;
    const remainingSlots = 5 - currentCount;

    if (remainingSlots <= 0) {
      alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
      return;
    }

    // 선택 수가 남은 슬롯보다 많으면 경고 후 남은 수만 처리
    if (files.length > remainingSlots) {
      alert(
        `이미지는 최대 5개까지 선택할 수 있습니다. 남은 슬롯이 ${remainingSlots}개뿐이므로 ${remainingSlots}개만 선택됩니다.`
      );
    }

    // 포맷 및 크기 검증
    const allowedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = files.filter((file) => {
      // 포맷 체크
      if (!allowedFormats.includes(file.type)) {
        alert(
          `${file.name}은(는) 지원하지 않는 형식입니다. (JPG, PNG, WEBP, GIF만 가능)`
        );
        return false;
      }
      // 파일 크기 체크
      if (file.size > maxSize) {
        alert(`${file.name}의 크기가 너무 큽니다. (최대 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // 남은 슬롯만큼만 파일 추가
    const filesToAdd = validFiles.slice(0, remainingSlots);
    const newImageUrls = filesToAdd.map((file) => URL.createObjectURL(file));

    setUploadedFiles((prev) => [...prev, ...filesToAdd]);
    setUploadedImageUrls((prev) => [...prev, ...newImageUrls]);
  };

  const removeImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePet = () => {
    setSelectedPet(null);
  };

  const handlePetSelect = (pet: PetCardAnimal) => {
    setSelectedPet(pet);
    setShowPetSelection(false);
  };

  const handleBack = () => {
    setShowBackConfirmSheet(true);
  };

  const handleSave = () => {
    // 공고를 선택하지 않은 상태에서 센터공개로 글 작성 시도 시
    if (!selectedPet && publicType === "center") {
      showToast("동물을 선택해주세요", "error");
      return;
    }

    setShowSaveModal(true);
  };

  const handlePublicChange = () => {
    setPublicType(publicType === "center" ? "public" : "center");
  };

  const getPublicIcon = () => {
    return publicType === "center" ? (
      <LockSimple size={16} />
    ) : (
      <Globe size={16} />
    );
  };

  const getPublicText = () => {
    return publicType === "center" ? "센터공개" : "전체공개";
  };

  // 내용 변경 (태그는 시스템 태그 선택으로만 관리)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
  };

  const addTag = (tagName: string) => {
    setTags((prev) => (prev.includes(tagName) ? prev : [...prev, tagName]));
  };

  const removeTag = (tagName: string) => {
    setTags((prev) => prev.filter((t) => t !== tagName));
  };

  // Form validation
  const isFormValid = useMemo(() => {
    const formData = {
      title,
      content,
    };

    try {
      uploadFormSchema.parse(formData);
      return true;
    } catch {
      return false;
    }
  }, [title, content]);

  // 전체 로딩 상태 (이미지 업로드 + 포스트 생성)
  const isLoading = isUploadingImages || isPending;

  const handleConfirmSave = async () => {
    try {
      let imageUrls: string[] = [];

      // 이미지가 있으면 먼저 업로드
      if (uploadedFiles.length > 0) {
        setIsUploadingImages(true);
        // 임시 포스트 ID 생성 (실제로는 서버에서 생성됨)
        const tempPostId = "temp_" + Date.now();

        try {
          // 이미지 업로드 수행
          const uploadResult = await new Promise<{
            message: string;
            images: string[];
          }>((resolve, reject) => {
            uploadImages(
              {
                postId: tempPostId,
                images: uploadedFiles,
              },
              {
                onSuccess: (data) => {
                  resolve(data);
                },
                onError: (error) => {
                  reject(error);
                },
              }
            );
          });

          imageUrls = uploadResult.images;
        } finally {
          setIsUploadingImages(false);
        }
      }

      // 포스트 생성 (이미지 URL 포함)
      const postData = {
        title,
        content,
        tags,
        images: imageUrls,
        animal_id: selectedPet?.id || undefined,
        is_all_access: publicType === "public",
      };

      console.log("전송할 포스트 데이터:", postData);
      console.log("태그 배열:", tags);

      createPost(postData, {
        onSuccess: (postData) => {
          console.log("포스트 생성 성공:", postData);
          setShowSaveModal(false);
          router.push("/community");
        },
        onError: (error) => {
          console.error("포스트 생성 실패:", error);
          console.error("에러 상세:", error.message);
        },
      });
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
    }
  };

  const handleConfirmBack = () => {
    setShowBackConfirmSheet(false);
    router.back();
  };

  return (
    <Container className="min-h-screen bg-white">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h3>글 업로드</h3>
          </div>
        }
      />

      <div className="px-4 pb-24">
        {/* 제목 입력 */}
        <div className="mb-6">
          <CustomInput
            label="제목"
            placeholder="제목을 입력하세요."
            value={title}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => setTitle(e.target.value)}
            variant="primary"
          />
        </div>

        {/* 내용 입력 */}
        <div className="mb-6">
          <h5 className="mb-2 text-dg">내용</h5>
          <textarea
            placeholder="오늘은 어떤 이야기를 나눠볼까요? 사진과 태그를 이용해 자유롭게 작성해보세요! #태그를 사용해보세요"
            value={content}
            onChange={handleContentChange}
            className="w-full h-32 p-4 border rounded-md resize-none border-lg text-body placeholder:text-gr focus:outline-none focus:border-brand"
          />
          {/* 선택된 태그 표시 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="px-2 py-1 text-xs rounded-full bg-white text-brand border border-brand"
                  title="클릭하여 태그 제거"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 시스템 태그 드롭다운 (CustomInput) */}
          {Array.isArray(systemTags) && systemTags.length > 0 && (
            <div className="mt-2">
              <CustomInput
                variant="tagdropdown"
                placeholder="태그를 선택하세요"
                value={tags.length > 0 ? `태그 ${tags.length}개 선택됨` : ""}
                options={systemTags
                  .filter((t) => !tags.includes(t.name))
                  .map((t) => t.name)}
                onChangeOption={(selected) => addTag(selected)}
              />
            </div>
          )}
        </div>

        {/* 관련 공고 선택 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-dg">관련 공고</h5>
            <MiniButton
              leftIcon={<ArrowDownLeft />}
              text="공고 선택"
              onClick={() => setShowPetSelection(true)}
            />
          </div>

          {selectedPet ? (
            <div className="relative">
              <PetCard
                pet={selectedPet}
                variant="variant4"
                className="w-full"
              />
              <IconButton
                icon={({ size }) => <X size={size} />}
                size="iconS"
                onClick={removePet}
                className="absolute text-gray-400 top-3 right-3"
              />
            </div>
          ) : (
            <div className="p-7.5 h-20 flex items-center justify-center bg-bg text-gr rounded-lg">
              <span className="text-center">아직 선택된 공고가 없어요.</span>
            </div>
          )}
        </div>

        {/* 사진/영상 업로드 */}
        <div className="mb-6">
          <h5 className="mb-2 text-dg">사진 / 영상 업로드</h5>
          <div className="flex flex-wrap gap-3">
            {/* 업로드 버튼 */}
            {uploadedImageUrls.length < 5 && (
              <label>
                <ImageCard
                  variant="add"
                  onClick={() => {}}
                  className="w-20 h-20"
                />
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      // 현재 개수 확인
                      const currentCount = uploadedFiles.length;
                      const remainingSlots = 5 - currentCount;

                      if (remainingSlots <= 0) {
                        alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
                        e.target.value = "";
                        return;
                      }

                      handleImageUpload(Array.from(files));
                    }
                    // input 값 초기화 (같은 파일 다시 선택 가능하도록)
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
            )}

            {/* 업로드된 이미지들 */}
            {uploadedImageUrls.map((imageUrl, index) => (
              <ImageCard
                key={index}
                src={imageUrl}
                alt={`업로드된 이미지 ${index + 1}`}
                variant="primary"
                onRemove={() => removeImage(index)}
                className="w-20 h-20"
              />
            ))}
          </div>
          {/* 남은 슬롯 표시 */}
          <div className="mt-2 text-sm text-gr">
            {uploadedImageUrls.length}/5 이미지 업로드됨
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <FixedBottomBar
        variant="variant2"
        resetButtonText={isAdmin ? "전체공개" : getPublicText()}
        resetButtonLeft={isAdmin ? <Globe size={16} /> : getPublicIcon()}
        onResetButtonClick={isAdmin ? undefined : handlePublicChange}
        applyButtonText={
          isLoading
            ? isUploadingImages
              ? "사진 업로드 중..."
              : "등록하는 중..."
            : "등록하기"
        }
        onApplyButtonClick={handleSave}
        applyButtonDisabled={!isFormValid || isLoading}
        showResetButton={isAdmin || hasAnyAdoptions}
      />

      {/* 공고 선택 BottomSheet */}
      <BottomSheet
        open={showPetSelection}
        onClose={() => setShowPetSelection(false)}
        variant="variant7"
        title="어떤 공고를 선택할까요?"
        tabs={[
          { label: "입양 진행중인 동물", value: "adoption" },
          { label: "찜한 동물 리스트", value: "favorite" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="h-[480px] overflow-y-auto scrollbar-hide">
          {animals.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-start gap-2">
                {animals.map((pet: PetCardAnimal) => (
                  <div
                    key={pet.id}
                    onClick={() => handlePetSelect(pet)}
                    className="cursor-pointer w-[calc(50%-4px)]"
                  >
                    <PetCard
                      pet={pet}
                      variant="primary"
                      disableNavigation
                      imageSize="full"
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              {hasNextPage && (
                <div className="px-4 py-3">
                  <MiniButton
                    text={isFetchingNextPage ? "불러오는 중..." : "더 보기"}
                    onClick={() => fetchNextPage()}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                {activeTab === "adoption"
                  ? "등록된 동물이 없습니다."
                  : "찜한 동물이 없습니다."}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* 뒤로가기 확인 BottomSheet */}
      <BottomSheet
        open={showBackConfirmSheet}
        onClose={() => setShowBackConfirmSheet(false)}
        variant="primary"
        title="창을 닫으면 저장되지 않아요!"
        description="작성한 내용은 저장 및 복구가 불가능해요."
        leftButtonText="취소"
        rightButtonText="괜찮아요"
        onLeftClick={() => setShowBackConfirmSheet(false)}
        onRightClick={handleConfirmBack}
      />

      {/* 저장 확인 모달 */}
      <CustomModal
        open={showSaveModal}
        onClose={() => !isLoading && setShowSaveModal(false)}
        title={
          isLoading
            ? isUploadingImages
              ? "사진을 업로드하는 중..."
              : "글을 등록하는 중..."
            : "글을 등록할까요?"
        }
        variant="variant1"
        leftButtonText="취소"
        rightButtonText={
          isLoading
            ? isUploadingImages
              ? "업로드 중..."
              : "등록 중..."
            : "등록하기"
        }
        onLeftClick={() => !isLoading && setShowSaveModal(false)}
        onRightClick={handleConfirmSave}
      />

      {/* 토스트 메시지 */}
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
