"use client";

import { useState, useRef, useEffect } from "react";
import { ImageCard } from "@/components/ui/ImageCard";
import { CustomInput } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { AddButton } from "@/components/ui/AddButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { breed } from "@/app/mock";
import { useUploadAnimalImages } from "@/hooks/mutation/useUploadAnimalImages";
import { openKakaoAddress } from "@/lib/openKakaoAddress";
import { NotificationToast } from "@/components/ui/NotificationToast";

interface BasicInfoData {
  name: string;
  protection_status: string;
  adoption_status: string;
  breed: string;
  age: string;
  gender: string;
  neutering: string;
  weight: string;
  color: string;
  foundLocation: string;
  personality: string;
  specialNotes: string;
  healthNotes: string;
  centerEntryDate: string;
  imageUrls?: string[]; // 업로드된 이미지 URL들
}

interface BasicInfoProps {
  data: BasicInfoData;
  onChange: (data: Partial<BasicInfoData>) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
}

export default function BasicInfo({
  data,
  onChange,
  images,
  onImagesChange,
}: BasicInfoProps) {
  const [isBreedSheetOpen, setIsBreedSheetOpen] = useState(false);
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const [tempSelectedBreed, setTempSelectedBreed] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extraFeatures, setExtraFeatures] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const uploadAnimalImages = useUploadAnimalImages();

  // 기존 이미지 URL이 있을 때 초기화
  useEffect(() => {
    if (data.imageUrls && data.imageUrls.length > 0) {
      setUploadedImageUrls(data.imageUrls);
    }
  }, [data.imageUrls]);

  const handleBreedSearchClick = () => {
    setTempSelectedBreed(data.breed);
    setIsBreedSheetOpen(true);
  };

  const handleBreedSelect = (breed: string) => {
    setTempSelectedBreed(breed);
  };

  const handleBreedApply = (breed: string) => {
    onChange({ breed });
    setIsBreedSheetOpen(false);
    setBreedSearchTerm("");
  };

  const filteredBreeds = breed.filter((b) =>
    b.toLowerCase().includes(breedSearchTerm.toLowerCase())
  );

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const totalImages = images.length + newImages.length;

      let imagesToUpload: File[] = [];

      if (totalImages <= 5) {
        imagesToUpload = newImages;
        onImagesChange([...images, ...newImages]);
      } else {
        const remainingSlots = 5 - images.length;
        if (remainingSlots > 0) {
          imagesToUpload = newImages.slice(0, remainingSlots);
          onImagesChange([...images, ...imagesToUpload]);
          showToastMessage(
            `최대 5장까지만 업로드할 수 있습니다. ${remainingSlots}장만 추가되었습니다.`,
            "error"
          );
        } else {
          showToastMessage("최대 5장까지만 업로드할 수 있습니다.", "error");
          return;
        }
      }

      // 이미지 서버에 업로드
      if (imagesToUpload.length > 0) {
        setIsUploading(true);
        try {
          const result = await uploadAnimalImages.mutateAsync({
            images: imagesToUpload,
          });

          const newUrls = [...uploadedImageUrls, ...result.images];
          setUploadedImageUrls(newUrls);
          onChange({ imageUrls: newUrls });
        } catch (error) {
          console.error("이미지 업로드 실패:", error);
          showToastMessage(
            "이미지 업로드에 실패했습니다. 다시 시도해주세요.",
            "error"
          );

          // 업로드 실패 시 로컬 이미지도 제거
          const failedImages = imagesToUpload;
          const updatedImages = images.filter(
            (img) => !failedImages.includes(img)
          );
          onImagesChange(updatedImages);
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    // 로컬 이미지 제거
    onImagesChange(images.filter((_, i) => i !== index));

    // 업로드된 URL도 제거
    if (uploadedImageUrls[index]) {
      const newUrls = uploadedImageUrls.filter((_, i) => i !== index);
      setUploadedImageUrls(newUrls);
      onChange({ imageUrls: newUrls });
    }
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleFoundLocationSearch = () => {
    openKakaoAddress((selectedAddress: string) => {
      onChange({ foundLocation: selectedAddress });
    });
  };

  const showToastMessage = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <div className="flex flex-col w-full px-4 gap-4 pb-4">
        <h4 className="text-left">기본 정보</h4>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* 이미지 업로드 영역 - 최대 5장, 가로 스크롤 */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3 px-3 -mx-3">
          {images.map((image, index) => (
            <ImageCard
              key={index}
              src={getImagePreview(image)}
              alt={`이미지 ${index + 1}`}
              onRemove={() => handleRemoveImage(index)}
            />
          ))}
          {images.length < 5 && (
            <ImageCard
              variant="add"
              onClick={isUploading ? undefined : handleAddImage}
            />
          )}
        </div>

        {/* 업로드 상태 표시 */}
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>이미지 업로드 중...</span>
          </div>
        )}

        {uploadedImageUrls.length > 0 && (
          <div className="text-sm text-green-600">
            ✓ {uploadedImageUrls.length}장의 이미지가 업로드되었습니다.
          </div>
        )}

        <CustomInput
          variant="primary"
          label="이름"
          placeholder="이름을 입력해주세요"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required={true}
        />
        <CustomInput
          variant="tagdropdown"
          label="보호 상태"
          placeholder="보호 상태를 선택해주세요"
          options={["보호중", "안락사", "자연사", "반환"]}
          value={data.protection_status}
          onChangeOption={(value) => onChange({ protection_status: value })}
          required={true}
        />
        <CustomInput
          variant="tagdropdown"
          label="입양 상태"
          placeholder="입양 상태를 선택해주세요"
          options={["입양가능", "입양진행중", "입양완료", "입양불가"]}
          value={data.adoption_status}
          onChangeOption={(value) => onChange({ adoption_status: value })}
          required={true}
        />
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">
            견종 <span className="text-brand">*</span>
          </h5>
          <div onClick={handleBreedSearchClick} className="cursor-pointer">
            <SearchInput
              variant="variant2"
              placeholder="품종으로 검색해보세요."
              value={data.breed}
              onChange={(e) => onChange({ breed: e.target.value })}
            />
          </div>
        </div>
        <CustomInput
          variant="primary"
          label="나이"
          placeholder="0~300개월 사이의 숫자를 입력해주세요."
          value={data.age}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            if (
              value === "" ||
              (parseInt(value) >= 0 && parseInt(value) <= 300)
            ) {
              onChange({ age: value });
            }
          }}
          required={true}
        />
        <CustomInput
          variant="Variant7"
          label="성별"
          twoOptions={["암컷", "수컷"]}
          value={data.gender}
          onChangeOption={(value) => onChange({ gender: value })}
          required={true}
        />
        <CustomInput
          variant="Variant7"
          label="중성화 여부"
          twoOptions={["했어요", "안했어요"]}
          value={data.neutering}
          onChangeOption={(value) => onChange({ neutering: value })}
          required={true}
        />
        <CustomInput
          variant="primary"
          label="무게"
          placeholder="0.01~100kg 사이의 값을 입력해주세요."
          value={data.weight}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9.]/g, ""); // 숫자와 소수점만 허용
            const dotCount = (value.match(/\./g) || []).length;
            if (dotCount <= 1) {
              const numValue = parseFloat(value);
              if (
                value === "" ||
                (numValue >= 0.01 && numValue <= 100) ||
                isNaN(numValue)
              ) {
                onChange({ weight: value });
              }
            }
          }}
          required={true}
        />
        <CustomInput
          variant="primary"
          label="색상"
          placeholder="예) 갈색, 검은색, 흰색"
          value={data.color}
          onChange={(e) => onChange({ color: e.target.value })}
          required={true}
        />
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">발견장소</h5>
          <div onClick={handleFoundLocationSearch} className="cursor-pointer">
            <SearchInput
              variant="variant2"
              placeholder="확실하지 않다면 추정으로 입력해주세요."
              value={data.foundLocation}
              onChange={(e) => onChange({ foundLocation: e.target.value })}
              onSearch={handleFoundLocationSearch}
            />
          </div>
        </div>
        <CustomInput
          variant="primary"
          label="성격"
          placeholder="예) 사람을 매우 잘따름"
          value={data.personality}
          onChange={(e) => onChange({ personality: e.target.value })}
        />
        <CustomInput
          variant="primary"
          label="특이사항"
          placeholder="예) 기다려, 앉아 가능"
          value={data.specialNotes}
          onChange={(e) => onChange({ specialNotes: e.target.value })}
        />
        <CustomInput
          variant="primary"
          label="건강 특징"
          placeholder="예) 심상사상충 치료중"
          value={data.healthNotes}
          onChange={(e) => onChange({ healthNotes: e.target.value })}
        />
        {extraFeatures.map((feature, index) => (
          <CustomInput
            key={index}
            variant="primary"
            label={`추가 특징 ${index + 1}`}
            placeholder="예) 산책 시 줄당김 없음"
            value={feature}
            onChange={(e) => {
              const updated = [...extraFeatures];
              updated[index] = e.target.value;
              setExtraFeatures(updated);
            }}
          />
        ))}
        <AddButton onClick={() => setExtraFeatures((prev) => [...prev, ""])}>
          특징 추가
        </AddButton>

        {/* 센터 입소일 - CustomInput 사용 */}
        <CustomInput
          variant="primary"
          label="센터 입소일"
          type="date"
          placeholder="센터에 들어온 날을 선택해주세요"
          value={data.centerEntryDate}
          onChange={(e) => onChange({ centerEntryDate: e.target.value })}
          required={true}
        />
      </div>

      {/* 견종 선택 BottomSheet */}
      <BottomSheet
        open={isBreedSheetOpen}
        onClose={() => setIsBreedSheetOpen(false)}
        variant="selectMenu"
        showApplyButton={true}
        applyButtonText="적용하기"
        onApply={handleBreedApply}
        selectedValue={tempSelectedBreed}
      >
        <div className="flex flex-col gap-4">
          <SearchInput
            variant="variant2"
            placeholder="품종으로 검색해보세요"
            value={breedSearchTerm}
            onChange={(e) => setBreedSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {filteredBreeds.length > 0 ? (
              <div className="flex flex-col">
                {filteredBreeds.map((breedItem, index) => (
                  <button
                    key={index}
                    className={`text-left p-3 rounded-lg transition-colors ${
                      tempSelectedBreed === breedItem
                        ? " text-blue-600 border border-brand"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleBreedSelect(breedItem)}
                  >
                    {breedItem}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* 토스트 메시지 */}
      {showToast && (
        <NotificationToast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
