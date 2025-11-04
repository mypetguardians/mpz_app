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
import { ArrowLeft, X, ArrowDownLeft } from "@phosphor-icons/react";
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
import { useGetSystemTags } from "@/hooks";
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
  const { data: systemTags } = useGetSystemTags();

  // blob URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 컴포넌트 unmount 시 모든 blob URL 해제
      newImageUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [newImageUrls]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const allowedFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      // 현재 총 이미지 개수(기존 + 새 이미지)
      const currentCount = existingImageUrls.length + newImageUrls.length;
      const remainingSlots = 5 - currentCount;
      if (remainingSlots <= 0) {
        alert("이미지는 최대 5개까지 업로드할 수 있습니다.");
        event.target.value = "";
        return;
      }

      const allSelected = Array.from(files);
      if (allSelected.length > remainingSlots) {
        alert(
          `이미지는 최대 5개까지 선택할 수 있습니다. 남은 슬롯이 ${remainingSlots}개뿐이므로 ${remainingSlots}개만 선택됩니다.`
        );
      }

      const selectedLimited = allSelected.slice(0, remainingSlots);

      const newFiles = selectedLimited.filter((file) => {
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

      if (newFiles.length > 0) {
        const newUrls = newFiles.map((file) => URL.createObjectURL(file));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
        setNewImageUrls((prev) => [...prev, ...newUrls]);
      }
    }
    // input 값 초기화 (같은 파일 다시 선택 가능하도록)
    event.target.value = "";
  };

  const removeExistingImage = (index: number) => {
    const imageToRemove = existingImageUrls[index];
    // 삭제 목록에 추가
    setDeletedImageUrls((prev) => [...prev, imageToRemove]);
    // UI에서 제거
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    // blob URL 해제 (메모리 정리)
    const urlToRemove = newImageUrls[index];
    if (urlToRemove && urlToRemove.startsWith("blob:")) {
      URL.revokeObjectURL(urlToRemove);
    }

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

  // (사용 안 함) 기존 해시태그 파싱 로직 제거

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

  // 전체 로딩 상태 (이미지 업로드 + 포스트 수정)
  const isLoading = isUploadingImages || isUpdatingPost;

  const handleConfirmSave = async () => {
    try {
      setShowSaveModal(false);

      // 1. 새로 업로드할 파일이 있으면 먼저 업로드
      let uploadedImageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        setIsUploadingImages(true);
        try {
          const uploadResult = await uploadImages({
            postId: postId,
            images: uploadedFiles,
          });
          uploadedImageUrls = uploadResult.images;
        } finally {
          setIsUploadingImages(false);
        }
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
      setIsUpdatingPost(true);
      try {
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
      } finally {
        setIsUpdatingPost(false);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      setIsUploadingImages(false);
      setIsUpdatingPost(false);
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
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => setTitle(e.target.value)}
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
          {/* 선택된 태그 표시 */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
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
            {/* 업로드 버튼 - 총 5개 미만일 때만 표시 */}
            {existingImageUrls.length + newImageUrls.length < 5 && (
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
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

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
        applyButtonText={
          isLoading
            ? isUploadingImages
              ? "사진 업로드 중..."
              : "수정하는 중..."
            : "수정하기"
        }
        onApplyButtonClick={handleSave}
        applyButtonDisabled={isLoading}
        showResetButton={false}
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
        onClose={() => !isLoading && setShowSaveModal(false)}
        title={
          isLoading
            ? isUploadingImages
              ? "사진을 업로드하는 중..."
              : "글을 수정하는 중..."
            : "글을 수정할까요?"
        }
        variant="variant1"
        leftButtonText="취소"
        rightButtonText={
          isLoading
            ? isUploadingImages
              ? "업로드 중..."
              : "수정 중..."
            : "수정하기"
        }
        onLeftClick={() => !isLoading && setShowSaveModal(false)}
        onRightClick={handleConfirmSave}
      />
    </Container>
  );
}
