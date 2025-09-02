"use client";

import { useState, useMemo, useEffect, use } from "react";
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
} from "@/hooks";
import type { PetCardAnimal } from "@/types/animal";
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

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");

  const { data: postData } = useGetPublicPostDetail(postId);

  const { mutate: updatePost } = useUpdatePost();
  const { mutate: uploadImages } = useUploadImages();

  const { user } = useAuth();
  const isAdmin = user?.userType !== "일반사용자";

  // 기존 포스트 데이터를 초기값으로 설정
  useEffect(() => {
    if (postData?.post) {
      setTitle(postData.post.title || "");
      setContent(postData.post.content || "");

      // 기존 태그를 tagName 또는 tag_name 필드에서 추출
      const existingTags =
        postData.post.tags
          ?.map(
            (tag: { tagName?: string; tag_name?: string }) =>
              tag.tagName || tag.tag_name || ""
          )
          .filter(Boolean) || [];

      setTags(existingTags);
      setPublicType(postData.post.adoptionId ? "center" : "public");

      // 기존 이미지가 있다면 설정
      if (postData.post.images && postData.post.images.length > 0) {
        setUploadedImageUrls(postData.post.images.map((img) => img.imageUrl));
      }

      // 기존 adoption_id가 있다면 설정
      if (postData.post.adoptionId) {
        setSelectedAdoptionId(postData.post.adoptionId);
        // adoptionAnimals에서 해당 동물 찾기
        // 이 부분은 adoptionAnimals가 로드된 후에 처리해야 함
      }
    }
  }, [postData]);

  // 사용자 타입에 따라 초기 공개 범위를 지정
  useEffect(() => {
    if (!user) return;
    if (!postData) {
      // 기존 데이터가 없을 때만 설정
      setPublicType(isAdmin ? "center" : "public");
    }
  }, [isAdmin, user, postData]);

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
      status: adoption.animal_status as PetCardAnimal["status"],
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

  // 기존 adoption_id가 있을 때 해당 동물을 selectedPet으로 설정
  useEffect(() => {
    if (selectedAdoptionId && adoptionAnimals.length > 0 && !selectedPet) {
      const matchingPet = adoptionAnimals.find(
        (pet) =>
          (pet as ExtendedPetCardAnimal).adoptionId === selectedAdoptionId
      );
      if (matchingPet) {
        setSelectedPet(matchingPet as ExtendedPetCardAnimal);
      }
    }
  }, [selectedAdoptionId, adoptionAnimals, selectedPet]);

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
        status: favoriteAnimal.status,
        centerId: favoriteAnimal.centerId,
        animalImages: [
          { id: "1", imageUrl: "/img/dummyImg.png", orderIndex: 1 },
        ],
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
      const newImageUrls = newFiles.map((file) => URL.createObjectURL(file));
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      setUploadedImageUrls((prev) => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
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

    // 기존 태그와 새로 추출된 태그를 합침
    const extractedTags = extractTags(newContent);
    const existingTags =
      postData?.post?.tags
        ?.map(
          (tag: { tagName?: string; tag_name?: string }) =>
            tag.tagName || tag.tag_name || ""
        )
        .filter(Boolean) || [];

    // 기존 태그와 새로 입력한 태그를 모두 포함, 유효한 문자열만 필터링
    const allTags = [...new Set([...existingTags, ...extractedTags])].filter(
      (tag) => typeof tag === "string" && tag.length > 0
    );
    setTags(allTags);
  };

  const handleConfirmSave = () => {
    // 먼저 포스트를 수정
    updatePost(
      {
        postId: postId,
        data: {
          title,
          content,
          tags,
          images: [],
        },
      },
      {
        onSuccess: (response) => {
          console.log("포스트 수정 성공:", response);
          // 포스트 수정 성공 후 새로 업로드된 이미지가 있으면 업로드
          if (uploadedFiles.length > 0) {
            uploadImages(
              {
                postId: postId,
                images: uploadedFiles,
              },
              {
                onSuccess: () => {
                  setShowSaveModal(false);
                  router.back();
                },
                onError: (error) => {
                  console.error("이미지 업로드 실패:", error);
                },
              }
            );
          } else {
            // 새로 업로드된 이미지가 없으면 바로 뒤로가기
            setShowSaveModal(false);
            router.back();
          }
        },
        onError: (error) => {
          console.error("포스트 수정 실패:", error);
          console.error("에러 상세:", error.message);
        },
      }
    );
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
            {uploadedImageUrls.map((imageUrl, index) => (
              <ImageCard
                key={index}
                src={imageUrl}
                alt={`이미지 ${index + 1}`}
                variant="primary"
                onRemove={() => removeImage(index)}
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
              <div className="flex flex-wrap justify-start gap-2 px-4">
                {animals.map((pet: PetCardAnimal) => (
                  <div
                    key={pet.id}
                    onClick={() =>
                      handlePetSelect(
                        pet,
                        (pet as ExtendedPetCardAnimal).adoptionId || ""
                      )
                    }
                    className="cursor-pointer w-[calc(50%-4px)]"
                  >
                    <PetCard
                      pet={pet}
                      variant="primary"
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
        title="잠을 닫으면 저장되지 않아요!"
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
