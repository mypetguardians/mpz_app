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
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");

  const {
    mutate: createPost,
    isPending: creating,
    isPending: isPending,
  } = useCreatePost();
  const { mutate: uploadImages, isPending: uploading } = useUploadImages();

  const { user } = useAuth();
  const isAdmin = user?.userType !== "일반사용자";

  // 사용자 타입에 따라 초기 공개 범위를 지정
  useEffect(() => {
    if (!user) return;
    setPublicType(isAdmin ? "center" : "public");
  }, [isAdmin, user]);

  const { data: adoptionsData } = useGetUserAdoptions({
    filters: {
      status: undefined,
    },
  });

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

  const favoriteAnimals = useMemo(() => {
    if (!favoriteAnimalsData?.animals) {
      return [];
    }

    const transformed = favoriteAnimalsData.animals.map((favoriteAnimal) => {
      return {
        id: favoriteAnimal.id,
        name: favoriteAnimal.name,
        breed: favoriteAnimal.breed,
        isFemale: favoriteAnimal.isFemale,
        protection_status: "보호중",
        adoption_status: "입양가능",
        centerId: favoriteAnimal.centerId,
        animalImages: [],
        foundLocation: "위치 정보 확인 불가", // 기본 지역 설정
      };
    }) as PetCardAnimal[];

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

    // 남은 슬롯만큼만 파일 추가
    const filesToAdd = files.slice(0, remainingSlots);
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

  // 태그 추출 함수 - 초성, 자음, 모음도 포함
  const extractTags = (text: string): string[] => {
    const tagRegex = /#([ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9_-]+)/g;
    const matches = text.match(tagRegex);
    if (!matches) return [];

    // # 제거하고 중복 제거
    const extractedTags = [...new Set(matches.map((tag) => tag.slice(1)))];
    console.log("추출된 태그:", extractedTags);
    return extractedTags;
  };

  // 내용이 변경될 때마다 태그 추출
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setTags(extractTags(newContent));
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

  const handleConfirmSave = async () => {
    try {
      let imageUrls: string[] = [];

      // 이미지가 있으면 먼저 업로드
      if (uploadedFiles.length > 0) {
        // 임시 포스트 ID 생성 (실제로는 서버에서 생성됨)
        const tempPostId = "temp_" + Date.now();

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
          <h5 className="text-dg mb-2">내용</h5>
          <textarea
            placeholder="오늘은 어떤 이야기를 나눠볼까요? 사진과 태그를 이용해 자유롭게 작성해보세요! #태그를 사용해보세요"
            value={content}
            onChange={handleContentChange}
            className="w-full h-32 p-4 border border-lg rounded-md resize-none text-body placeholder:text-gr focus:outline-none focus:border-brand"
          />
          {/* 추출된 태그 표시 */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-brand text-wh text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
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
                className="absolute top-3 right-3 text-gray-400"
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
          <h5 className="text-dg mb-2">사진 / 영상 업로드</h5>
          <div className="flex gap-3 flex-wrap">
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
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      handleImageUpload(Array.from(files));
                    }
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
        resetButtonText={getPublicText()}
        resetButtonLeft={getPublicIcon()}
        onResetButtonClick={handlePublicChange}
        applyButtonText={isPending ? "등록하는 중..." : "등록하기"}
        onApplyButtonClick={handleSave}
        applyButtonDisabled={!isFormValid || creating || uploading}
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
        onClose={() => setShowSaveModal(false)}
        title="글을 등록할까요?"
        variant="variant1"
        leftButtonText="취소"
        rightButtonText="등록하기"
        onLeftClick={() => setShowSaveModal(false)}
        onRightClick={handleConfirmSave}
      />
    </Container>
  );
}
