"use client";

import { useState, useMemo, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CustomInput } from "@/components/ui/CustomInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CustomModal } from "@/components/ui/CustomModal";
import { FixedBottomBar } from "@/components/ui/FixedBottomBar";
import { PetCard } from "@/components/ui/PetCard";
import { useAuth } from "@/components/providers/AuthProvider";
import { ImageCard } from "@/components/ui/ImageCard";
import { getFullImageUrl } from "@/lib/utils";
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
  useUpdatePost,
  useGetUserAdoptions,
  useGetAnimalFavorites,
  useUploadImages,
  useGetPublicPostDetail,
  useGetAnimalById,
} from "@/hooks";
import type { PetCardAnimal, RawAnimalResponse } from "@/types/animal";
import type { UserAdoptionOut } from "@/types/adoption";

// PetCardAnimal을 확장한 타입 (adoptionId 포함)
type ExtendedPetCardAnimal = PetCardAnimal & { adoptionId?: string };

type PublicType = "center" | "public";

export default function CommunityEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: postId } = use(params); // params를 unwrap

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPet, setSelectedPet] = useState<ExtendedPetCardAnimal | null>(
    null
  );
  const [selectedAdoptionId, setSelectedAdoptionId] = useState<string | null>(
    null
  );

  // 기존 이미지와 새 이미지를 분리하여 관리
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");

  const {
    data: postData,
    isLoading: isLoadingPost,
    error: postError,
  } = useGetPublicPostDetail(postId);

  const { mutateAsync: updatePost } = useUpdatePost();
  const { mutateAsync: uploadImages } = useUploadImages();

  const { user } = useAuth();
  const isAdmin = user?.userType !== "일반사용자";

  // 포스트에 animal_id가 있을 때만 동물 정보 불러오기
  const { data: animalData } = useGetAnimalById(
    postData?.post?.animal_id || null
  );

  // 동물 데이터를 PetCardAnimal 형태로 변환하는 헬퍼 함수
  const convertAnimalToPetCard = useCallback(
    (rawAnimal: RawAnimalResponse | null): ExtendedPetCardAnimal | null => {
      if (!rawAnimal) return null;

      return {
        id: rawAnimal.id,
        name: rawAnimal.name,
        breed: rawAnimal.breed || null,
        isFemale: rawAnimal.is_female,
        protection_status: "보호중",
        adoption_status: "입양가능",
        centerId: rawAnimal.center_id,
        animalImages:
          rawAnimal.animal_images?.map((img) => ({
            id: img.id,
            imageUrl: img.image_url,
            orderIndex: img.order_index,
          })) || [],
        foundLocation: rawAnimal.found_location || "위치 정보 확인 불가",
        adoptionId: undefined,
        waitingDays: rawAnimal.waiting_days,
        admissionDate: rawAnimal.admission_date,
      };
    },
    []
  );

  // 기존 포스트 데이터를 초기값으로 설정
  useEffect(() => {
    if (postData?.post) {
      setTitle(postData.post.title || "");
      setContent(postData.post.content || "");

      // 기존 태그를 tag_name 필드에서 추출 (API 응답 구조에 맞게 수정)
      const existingTags =
        postData.post.tags?.map((tag) => tag.tag_name).filter(Boolean) || [];
      setTags(existingTags);

      // 공개 범위 설정 - is_all_access 필드를 확인
      const newPublicType = postData.post.is_all_access ? "public" : "center";
      setPublicType(newPublicType);

      // 기존 이미지가 있다면 설정
      if (postData.post.images && postData.post.images.length > 0) {
        // 이미지 객체의 구조를 확인하여 올바른 속성명 사용
        const imageUrls = postData.post.images
          .map((img) => img.image_url)
          .filter((url): url is string => Boolean(url));

        setExistingImageUrls(imageUrls);
      } else {
        setExistingImageUrls([]);
      }

      // 새 이미지 관련 상태 초기화
      setNewImageUrls([]);
      setUploadedFiles([]);
      setDeletedImageUrls([]);

      // adoptionId 설정 (필드 제거됨)
      setSelectedAdoptionId(null);
    }
  }, [postData]);

  // animalData가 로드되었을 때 동물 정보를 selectedPet으로 설정
  useEffect(() => {
    if (postData?.post?.animal_id && animalData) {
      const convertedAnimal = convertAnimalToPetCard(animalData);
      if (convertedAnimal) {
        setSelectedPet(convertedAnimal);
      }
    } else if (!postData?.post?.animal_id) {
      setSelectedPet(null);
    }
  }, [animalData, postData?.post?.animal_id, convertAnimalToPetCard]);

  // 사용자 타입에 따라 초기 공개 범위를 지정 (새 포스트일 때만)
  useEffect(() => {
    if (!user) return;
    // 기존 포스트 데이터가 없고, 아직 publicType이 초기값일 때만 설정
    if (!postData && publicType === "center") {
      const initialPublicType = isAdmin ? "center" : "public";
      setPublicType(initialPublicType);
    }
  }, [isAdmin, user, postData, publicType]);

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

  // adoptionId가 있을 때 해당 동물을 찾아서 설정 (입양 진행 중인 경우)
  useEffect(() => {
    if (selectedAdoptionId && adoptionAnimals.length > 0) {
      const matchingPet = adoptionAnimals.find(
        (pet) =>
          (pet as ExtendedPetCardAnimal).adoptionId === selectedAdoptionId
      );

      if (matchingPet) {
        setSelectedPet(matchingPet as ExtendedPetCardAnimal);
      }
    }
  }, [selectedAdoptionId, adoptionAnimals]);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setNewImageUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removeExistingImage = (index: number) => {
    const imageToRemove = existingImageUrls[index];
    // 삭제 목록에 추가
    setDeletedImageUrls((prev) => [...prev, imageToRemove]);
    // UI에서 제거
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    // 새 이미지와 파일 목록에서 제거
    setNewImageUrls((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePet = () => {
    setSelectedPet(null);
    setSelectedAdoptionId(null);
  };

  const handlePetSelect = (pet: PetCardAnimal, adoptionId: string) => {
    setSelectedPet(pet);
    setSelectedAdoptionId(adoptionId);
    setShowPetSelection(false);
  };

  const handleBack = () => {
    setShowBackConfirmSheet(true);
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handlePublicChange = () => {
    setPublicType(publicType === "public" ? "center" : "public");
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

    // # 제거하고 중복 제거, 빈 문자열 필터링
    return [
      ...new Set(
        matches.map((tag) => tag.slice(1)).filter((tag) => tag.length > 0)
      ),
    ];
  };

  // 내용이 변경될 때마다 태그 추출
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // 새로 추출된 태그만 설정 (기존 태그는 이미 초기화 시에 설정됨)
    const extractedTags = extractTags(newContent);

    setTags(extractedTags);
  };

  const handleConfirmSave = async () => {
    try {
      setShowSaveModal(false);

      // 1. 새로 업로드할 파일이 있으면 먼저 업로드
      let uploadedImageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        const uploadResult = await uploadImages({
          postId: postId,
          images: uploadedFiles,
        });
        uploadedImageUrls = uploadResult.images;
      }

      // 2. 최종 이미지 목록 계산
      // 기존 이미지 중 삭제되지 않은 것들만 유지
      const remainingExistingUrls = existingImageUrls.filter(
        (url) => url && url.trim() !== "" && !deletedImageUrls.includes(url)
      );

      // 업로드된 이미지 중 유효한 것들만 필터링
      const validUploadedUrls = uploadedImageUrls.filter(
        (url) => url && url.trim() !== ""
      );

      // 최종 이미지 배열: 남은 기존 이미지 + 새로 업로드된 이미지
      const finalImageUrls = [...remainingExistingUrls, ...validUploadedUrls];

      // 빈 배열인 경우 undefined로 전송 (null 배열 방지)
      const imagesToSend = finalImageUrls.length > 0 ? finalImageUrls : [];

      // 3. 포스트 수정
      const updateData = {
        title,
        content,
        tags,
        animal_id: selectedPet?.id || null,
        is_all_access: publicType === "public",
        images: imagesToSend.length > 0 ? imagesToSend : [],
      };

      await updatePost({
        postId: postId,
        data: updateData,
      });

      router.back();
    } catch (error) {
      console.error("저장 실패:", error);
      setShowSaveModal(true); // 모달 다시 열기
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleConfirmBack = () => {
    setShowBackConfirmSheet(false);
    router.back();
  };

  // postId가 없을 때 처리
  if (!postId) {
    router.push("/community");
    return null;
  }

  // 로딩 중이거나 에러가 있을 때 처리
  if (isLoadingPost) {
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
              <h3>글 수정하기</h3>
            </div>
          }
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-gr">글을 불러오는 중...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (postError) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => router.push("/community")}
              />
              <h3>글 수정하기</h3>
            </div>
          }
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 mb-4">
              글을 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-brand text-white rounded-md"
            >
              돌아가기
            </button>
          </div>
        </div>
      </Container>
    );
  }

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
            <h3>글 수정하기</h3>
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            variant="primary"
            className="focus:outline-none focus:border-brand"
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
                  className="px-2 py-1 bg-brand-op text-white text-xs rounded-full"
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
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {/* 기존 이미지들 */}
            {existingImageUrls.map((imageUrl, index) => (
              <ImageCard
                key={`existing-${index}`}
                src={getFullImageUrl(imageUrl)}
                alt={`기존 이미지 ${index + 1}`}
                variant="primary"
                onRemove={() => removeExistingImage(index)}
                className="w-20 h-20"
              />
            ))}

            {/* 새로 업로드된 이미지들 */}
            {newImageUrls.map((imageUrl, index) => (
              <ImageCard
                key={`new-${index}`}
                src={imageUrl}
                alt={`새 이미지 ${index + 1}`}
                variant="primary"
                onRemove={() => removeNewImage(index)}
                className="w-20 h-20"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <FixedBottomBar
        variant="variant2"
        resetButtonText={getPublicText()}
        resetButtonLeft={getPublicIcon()}
        onResetButtonClick={handlePublicChange}
        applyButtonText="수정하기"
        onApplyButtonClick={handleSave}
        applyButtonDisabled={false}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePetSelect(
                        pet,
                        (pet as ExtendedPetCardAnimal).adoptionId || ""
                      );
                    }}
                    className="cursor-pointer w-[calc(50%-4px)]"
                  >
                    <PetCard
                      pet={pet}
                      variant="primary"
                      imageSize="full"
                      className="w-full"
                      disableNavigation={true}
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
        title="글을 수정할까요?"
        variant="variant1"
        leftButtonText="취소"
        rightButtonText="수정하기"
        onLeftClick={() => setShowSaveModal(false)}
        onRightClick={handleConfirmSave}
      />
    </Container>
  );
}
