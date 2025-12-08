"use client";

import { useState, useEffect, useRef } from "react";
import {
  ImageCard,
  CustomInput,
  SearchInput,
  CustomModal,
  AddButton,
} from "@/components/ui";
import { CaretDown } from "@phosphor-icons/react";
import { pickImages } from "@/lib/image-picker";

import { openKakaoAddress } from "@/lib/openKakaoAddress";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { CenterBreedList } from "@/data/breedList";

interface BasicInfoData {
  name: string;
  protection_status: string;
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
  onImageAdd?: (files: File[]) => void;
  uploadingImageIndexes?: Set<number>;
}

export default function BasicInfo({
  data,
  onChange,
  images,
  onImagesChange,
  onImageAdd,
  uploadingImageIndexes = new Set(),
}: BasicInfoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [extraFeatures, setExtraFeatures] = useState<string[]>([]);
  // 업로드된 이미지 URL 관리는 제출 시 상위에서 처리
  const [isFoundLocationDialogOpen, setIsFoundLocationDialogOpen] =
    useState(false);
  const [baseFoundLocation, setBaseFoundLocation] = useState(
    data.foundLocation || ""
  );
  const [detailAddress, setDetailAddress] = useState("");
  const [isManualFoundLocation, setIsManualFoundLocation] = useState(false);

  // 외부 클릭 시 dropdown 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 품종 검색 결과 필터링
  const filteredBreeds = CenterBreedList.filter((breed) =>
    breed.toLowerCase().includes(breedSearchTerm.toLowerCase())
  );
  // 업로드 진행 상태 관리는 제출 시 상위에서 처리

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // 이미지 업로드는 상위에서 처리하므로 이 컴포넌트에서는 별도 효과 없음

  useEffect(() => {
    if (isManualFoundLocation) {
      return;
    }

    const combinedLocation = [baseFoundLocation, detailAddress]
      .filter((value) => value && value.trim() !== "")
      .join(" ");

    if (!data.foundLocation) {
      if (baseFoundLocation || detailAddress) {
        setBaseFoundLocation("");
        setDetailAddress("");
      }
      return;
    }

    if (data.foundLocation !== combinedLocation) {
      setBaseFoundLocation(data.foundLocation);
      if (detailAddress) {
        setDetailAddress("");
      }
    }
  }, [
    data.foundLocation,
    baseFoundLocation,
    detailAddress,
    isManualFoundLocation,
  ]);

  const handleBreedSearchClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    onChange({ breed: nextValue });
    setBreedSearchTerm(nextValue);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleBreedSelect = (breed: string) => {
    onChange({ breed });
    setBreedSearchTerm(breed);
    setIsDropdownOpen(false);
  };

  const handleAddImage = async () => {
    const existingCount = data.imageUrls?.length ?? 0;
    const remainingSlots = 5 - (existingCount + images.length);

    if (remainingSlots <= 0) {
      showToastMessage("최대 5장까지만 업로드할 수 있습니다.", "error");
      return;
    }
    try {
      const files = await pickImages({
        multiple: true,
        maxCount: remainingSlots,
      });

      if (files.length > 0) {
        const newTotal = existingCount + images.length + files.length;

        if (newTotal <= 5) {
          if (onImageAdd) {
            onImageAdd(files);
          } else {
            onImagesChange([...images, ...files]);
          }
        } else {
          const filesToAdd = files.slice(0, remainingSlots);
          if (onImageAdd) {
            onImageAdd(filesToAdd);
          } else {
            onImagesChange([...images, ...filesToAdd]);
          }
          showToastMessage(
            `최대 5장까지만 업로드할 수 있습니다. ${remainingSlots}장만 추가되었습니다.`,
            "error"
          );
        }
      }
    } catch (error) {
      console.error("이미지 선택 실패:", error);
    }
  };

  const handleRemoveImage = (index: number) => {
    // 로컬 이미지 제거
    onImagesChange(images.filter((_, i) => i !== index));

    // 업로드된 URL은 제출 시에만 생성되므로 여기서는 로컬 미리보기만 제거
  };

  const handleRemoveExistingImage = (index: number) => {
    if (!data.imageUrls) {
      return;
    }
    const next = data.imageUrls.filter((_, i) => i !== index);
    onChange({ imageUrls: next });
  };

  // 이미지 프리뷰 URL을 캐시하여 입력 변화로 인한 재렌더링 때 깜빡임 방지
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  useEffect(() => {
    // 기존 URL revoke
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    // 새 URL 생성 (images 변경시에만)
    const nextUrls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextUrls);
    // 언마운트/갱신 시 정리
    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // images만 의존성으로 두어 다른 입력 변경 시 프리뷰 재생성 안 되도록 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const handleFoundLocationSearch = () => {
    setIsManualFoundLocation(false);
    openKakaoAddress((selectedAddress: string) => {
      setBaseFoundLocation(selectedAddress);
      setDetailAddress("");
      onChange({ foundLocation: selectedAddress });
    });
  };

  const handleDetailAddressChange = (detailAddress: string) => {
    const combinedLocation = detailAddress
      ? [baseFoundLocation, detailAddress]
          .filter((value) => value && value.trim() !== "")
          .join(" ")
      : baseFoundLocation;

    setDetailAddress(detailAddress);
    onChange({ foundLocation: combinedLocation });
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
      <div className="flex flex-col w-full gap-4 px-4 pb-4">
        <h4 className="text-left">기본 정보</h4>

        {/* 이미지 업로드 영역 - 최대 5장, 가로 스크롤 */}
        <div className="flex gap-3 px-3 py-3 -mx-3 overflow-x-auto scrollbar-hide">
          {data.imageUrls?.map((url, index) => (
            <ImageCard
              key={`existing-${index}`}
              src={url}
              alt={`기존 이미지 ${index + 1}`}
              onRemove={() => handleRemoveExistingImage(index)}
            />
          ))}
          {images.map((_, index) => (
            <div key={index} className="relative">
              <ImageCard
                src={previewUrls[index]}
                alt={`이미지 ${index + 1}`}
                onRemove={() => handleRemoveImage(index)}
              />
              {uploadingImageIndexes.has(index) && (
                <div className="absolute inset-0 bg-black/50 rounded-[10px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-xs">업로드 중...</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {(data.imageUrls?.length || 0) + images.length < 5 && (
            <ImageCard variant="add" onClick={handleAddImage} />
          )}
        </div>

        {/* 업로드 상태/결과 표시는 제출 단계로 이동 */}

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
          options={[
            "보호중",
            "임시보호",
            "안락사",
            "자연사",
            "반환",
            "기증",
            "방사",
            "입양완료",
          ]}
          value={data.protection_status}
          onChangeOption={(value) => onChange({ protection_status: value })}
          required={true}
        />
        <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
          <h5 className="text-dg">
            견종 <span className="text-brand">*</span>
          </h5>
          <div className="relative">
            <SearchInput
              variant="variant2"
              placeholder="품종으로 검색해보세요."
              value={data.breed}
              onChange={handleSearchChange}
              onFocus={() => setIsDropdownOpen(true)}
            />
            <span
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 cursor-pointer"
              onClick={handleBreedSearchClick}
            >
              <CaretDown
                size={18}
                className={`transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </span>
          </div>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="flex flex-col p-4">
                {/* 품종 리스트 표시 */}
                <div className="max-h-96 overflow-y-auto scrollbar-hide">
                  {filteredBreeds.length > 0 ? (
                    <div className="flex flex-col">
                      <div className="space-y-1">
                        {filteredBreeds.map((breedItem, index) => (
                          <button
                            key={index}
                            className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                              data.breed === breedItem
                                ? "bg-blue-50 text-blue-600 border border-blue-200"
                                : "text-gray-800"
                            }`}
                            onClick={() => handleBreedSelect(breedItem)}
                          >
                            {breedItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : breedSearchTerm ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">
                        &ldquo;{breedSearchTerm}&rdquo;에 해당하는 품종이
                        없습니다
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500">
                        품종명을 입력하여 검색해보세요
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
          required={false}
        />
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">발견장소</h5>
          <div className="flex flex-col">
            <CustomInput
              variant="primary"
              placeholder="발견장소를 입력해주세요 (예: 101동 201호, 상가 1층)"
              value={detailAddress}
              onChange={(e) => handleDetailAddressChange(e.target.value)}
              id="detailAddress"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">성격</h5>
          <textarea
            className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예) 사람을 매우 잘따름"
            value={data.personality}
            onChange={(e) => onChange({ personality: e.target.value })}
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">특이사항</h5>
          <textarea
            className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="예) 기다려, 앉아 가능"
            value={data.specialNotes}
            onChange={(e) => onChange({ specialNotes: e.target.value })}
            rows={3}
          />
        </div>
        <CustomInput
          variant="primary"
          label="건강 및 의료기록"
          placeholder="예) 심장사상충 치료 시작 2025.05.24"
          value={data.healthNotes}
          onChange={(e) => onChange({ healthNotes: e.target.value })}
        />
        {extraFeatures.map((feature, index) => (
          <CustomInput
            key={index}
            variant="primary"
            label="건강데이터 추가"
            placeholder="예) 심장사상충 치료 시작 2025.05.24"
            value={feature}
            onChange={(e) => {
              const updated = [...extraFeatures];
              updated[index] = e.target.value;
              setExtraFeatures(updated);
            }}
          />
        ))}
        <AddButton onClick={() => setExtraFeatures((prev) => [...prev, ""])}>
          건강데이터 추가
        </AddButton>

        {/* 센터 입소일 - CustomInput 사용 */}
        <CustomInput
          variant="primary"
          label="센터 입소일"
          type="date"
          placeholder="센터에 들어온 날을 선택해주세요"
          value={data.centerEntryDate}
          onChange={(e) => onChange({ centerEntryDate: e.target.value })}
          required={false}
        />
      </div>

      {/* 발견장소 입력 방식 선택 모달 */}
      <CustomModal
        open={isFoundLocationDialogOpen}
        onClose={() => setIsFoundLocationDialogOpen(false)}
        title="발견장소 입력 방식 선택"
        description="어떻게 입력할까요?"
        variant="variant1"
        leftButtonText="직접입력"
        rightButtonText="주소찾기"
        onLeftClick={() => {
          setIsManualFoundLocation(true);
          setIsFoundLocationDialogOpen(false);
        }}
        onRightClick={() => {
          setIsFoundLocationDialogOpen(false);
          setTimeout(() => {
            handleFoundLocationSearch();
          }, 0);
        }}
      />

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
