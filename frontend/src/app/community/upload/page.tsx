"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { Input } from "@/components/ui/CustomInput";
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
import { useCreatePost, useGetAnimals, useUploadMultipleImages } from "@/hooks";
import type { AnimalResponseSchema } from "@/server/openapi/routes/animal";

type PublicType = "center" | "public";

const uploadFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  selectedPet: z
    .object({})
    .nullable()
    .refine((val) => val !== null, "관련 공고를 선택해주세요"),
  uploadedImages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export default function CommunityUploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedPet, setSelectedPet] = useState<Animal | null>(null);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showBackConfirmSheet, setShowBackConfirmSheet] = useState(false);
  const [activeTab, setActiveTab] = useState("adoption");
  const [publicType, setPublicType] = useState<PublicType>("center");

  const { mutate: createPost, isPending: creating } = useCreatePost();
  const { mutate: uploadImages, isPending: uploadingImages } =
    useUploadMultipleImages();

  type Animal = z.infer<typeof AnimalResponseSchema>;

  const { user } = useAuth();
  const isAdmin = user?.userType !== "일반사용자";

  // 사용자 타입에 따라 초기 공개 범위를 지정
  useEffect(() => {
    if (!user) return;
    setPublicType(isAdmin ? "center" : "public");
  }, [isAdmin, user]);

  // 동물 목록 (무한 스크롤)
  const {
    data: animalsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAnimals({ status: "보호중", limit: 20 });

  const animals = useMemo(() => {
    return animalsPages?.pages.flatMap((p) => p.animals) ?? [];
  }, [animalsPages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newImageUrls = newFiles.map((file) => URL.createObjectURL(file));

      setUploadedImages((prev) => [...prev, ...newFiles]);
      setUploadedImageUrls((prev) => [...prev, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removePet = () => {
    setSelectedPet(null);
  };

  const handlePetSelect = (pet: Animal) => {
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
    if (!isAdmin) return; // 일반사용자는 전체공개 고정
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

  // 태그 추출 함수
  const extractTags = (text: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex);
    if (!matches) return [];

    // # 제거하고 중복 제거
    return [...new Set(matches.map((tag) => tag.slice(1)))];
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
      selectedPet,
      uploadedImages: uploadedImageUrls,
      tags,
    };

    try {
      uploadFormSchema.parse(formData);
      return true;
    } catch {
      return false;
    }
  }, [title, content, selectedPet, uploadedImageUrls, tags]);

  const handleConfirmSave = () => {
    // 먼저 포스트를 생성
    createPost(
      {
        title,
        content,
        animalId: selectedPet?.id,
        contentTags: tags.join(","), // 태그를 쉼표로 구분하여 contentTags에 저장
        visibility: publicType,
      },
      {
        onSuccess: (response) => {
          // 포스트 생성 성공 후 이미지 업로드
          if (uploadedImages.length > 0) {
            uploadImages(
              {
                postId: response.community.id,
                images: uploadedImages,
              },
              {
                onSuccess: () => {
                  setShowSaveModal(false);
                  router.back();
                },
                onError: (error) => {
                  console.error("이미지 업로드 실패:", error);
                  // 이미지 업로드 실패해도 포스트는 생성되었으므로 뒤로가기
                  setShowSaveModal(false);
                  router.back();
                },
              }
            );
          } else {
            // 이미지가 없으면 바로 뒤로가기
            setShowSaveModal(false);
            router.back();
          }
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
            <h3>글 업로드</h3>
          </div>
        }
      />

      <div className="px-4 pb-24">
        {/* 제목 입력 */}
        <div className="mb-6">
          <Input
            label="제목"
            placeholder="제목을 입력하세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            className="w-full h-32 p-4 border border-input rounded-md resize-none text-body placeholder:text-gr focus:outline-none focus:border-brand"
          />
          {/* 추출된 태그 표시 */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
            <div className="p-7.5 text-center bg-bg text-gr rounded-lg">
              아직 선택된 공고가 없어요.
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
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <FixedBottomBar
        variant="variant2"
        resetButtonText={getPublicText()}
        resetButtonLeft={getPublicIcon()}
        onResetButtonClick={handlePublicChange}
        applyButtonText="등록하기"
        onApplyButtonClick={handleSave}
        applyButtonDisabled={!isFormValid || creating || uploadingImages}
      />

      {/* 공고 선택 BottomSheet */}
      <BottomSheet
        open={showPetSelection}
        onClose={() => setShowPetSelection(false)}
        variant="variant7"
        title="어떤 공고를 선택할까요?"
        tabs={[
          { label: "입양 진행중인 공고", value: "adoption" },
          { label: "접한 공고", value: "recent" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="h-[480px] overflow-y-auto">
          <div className="flex flex-wrap justify-start gap-2 px-4">
            {animals.map((pet) => (
              <div
                key={pet.id}
                onClick={() => handlePetSelect(pet)}
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
