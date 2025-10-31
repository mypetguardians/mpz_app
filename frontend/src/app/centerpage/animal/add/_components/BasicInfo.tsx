"use client";

import { useState, useRef, useEffect } from "react";
import { ImageCard } from "@/components/ui/ImageCard";
import { CustomInput } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { CustomModal } from "@/components/ui";
import { AddButton } from "@/components/ui/AddButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
// 고정 품종 목록
const breedList = [
  "골든 리트리버",
  "그레이트 덴",
  "그레이하운드",
  "꼬똥 드 툴레아",
  "네오폴리탄 마스티프",
  "노르위전 엘크하운드",
  "노리치 테리어",
  "노바 스코샤 덕 톨링 리트리버",
  "노퍽 테리어",
  "뉴펀들랜드",
  "닥스훈트",
  "달마시안",
  "댄디 딘몬트 테리어",
  "도고 아르헨티노",
  "도베르만",
  "도사",
  "디어하운드",
  "라사 압소",
  "라지 먼스터랜더",
  "래브라도 리트리버",
  "러프 콜리",
  "레온베르거",
  "레이크랜드 테리어",
  "로디지안 리즈백",
  "로트와일러",
  "리틀 라이언 독",
  "마스티프",
  "말티즈",
  "맨체스터 테리어",
  "미니어쳐 불 테리어",
  "미니어쳐 핀셔",
  "믹스",
  "바센지",
  "바셋 하운드",
  "바이마라너",
  "버니즈 마운틴 독",
  "베들링턴 테리어",
  "벨지안 셰퍼드",
  "보더 콜리",
  "보르조이",
  "보스턴 테리어",
  "복서",
  "부비에 데 플랑드르",
  "불 테리어",
  "불독",
  "불마스티프",
  "브뤼셀 그리폰",
  "브리타니 스파니엘",
  "블랙 앤 탄 쿤 하운드",
  "블러드하운드",
  "비글",
  "비숑 프리제",
  "비어디드 콜리",
  "비즐라",
  "빠삐용",
  "쁘띠 바셋 그리폰 벤딘",
  "사모예드",
  "살루키",
  "샤페이",
  "세인트 버나드",
  "센트럴 아시아 셰퍼드독",
  "셔틀랜드 쉽독",
  "셰퍼드",
  "슈나우저",
  "스무스 콜리",
  "스무스 폭스 테리어",
  "스카이 테리어",
  "스코티쉬 테리어",
  "스탠다드 푸들",
  "스피츠",
  "시바",
  "시베리안 허스키",
  "시츄",
  "시코쿠",
  "실리햄 테리어",
  "아메리칸 스태포드셔 테리어",
  "아메리칸 아키타",
  "아이리쉬 레드 세터",
  "아이리쉬 레드 앤 화이트 세터",
  "아이리쉬 울프하운드",
  "아이리쉬 워터 스파니엘",
  "아이리쉬소프트 코티드 휘튼 테리어",
  "아자와크",
  "아키타",
  "아펜핀셔",
  "아프간 하운드",
  "알라스칸 말라뮤트",
  "에어데일 테리어",
  "오스트레일리언 셰퍼드",
  "오스트레일리언 캐틀 독",
  "올드 잉글리쉬 쉽독",
  "와이어 폭스 테리어",
  "요크셔 테리어",
  "웨스트 시베리안 라이카",
  "웨스티(웨스트 하일랜드 화이트 테리어)",
  "웰시 테리어",
  "웰시코기",
  "이스트 시베리안 라이카",
  "이탈리언 그레이하운드",
  "잉글리쉬 세터",
  "잉글리쉬 스프링거 스파니엘",
  "잉글리쉬 포인터",
  "자이언트 슈나우저",
  "잭 러셀 테리어",
  "저먼 숏 헤어드 포인팅 독",
  "저먼 와이어 헤어드 포인팅 독",
  "저먼 헌팅 테리어",
  "제패니즈 친",
  "진돗개",
  "차우차우",
  "차이니즈 크레스티드 독",
  "체코슬로바키안 울프독",
  "치와와",
  "캐벌리어 킹 찰스 스파니엘",
  "케리 블루 테리어",
  "케언 테리어",
  "케인 코르소 이탈리아노",
  "코몬도르",
  "코카스파니엘",
  "코카시안 셰퍼드독",
  "키슈",
  "키스혼드",
  "킹 찰스 스파니엘",
  "타이 리지백 독",
  "타이완 독",
  "티베탄 마스티프",
  "티베탄 테리어",
  "파라오 하운드",
  "파슨 러셀 테리어",
  "퍼그",
  "페키니즈",
  "포르투기즈 워터 독",
  "포메라니언",
  "푸들",
  "풀리",
  "프레사 까나리오",
  "프렌치 불독",
  "플랫 코티드 리트리버",
  "피레니언 마운틴 독",
  "필라 브라질레이로",
  "해리어",
  "호카이도",
  "휘핏",
];
import { useUploadAnimalImages } from "@/hooks/mutation/useUploadAnimalImages";
import { openKakaoAddress } from "@/lib/openKakaoAddress";
import { NotificationToast } from "@/components/ui/NotificationToast";

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
  const [isFoundLocationDialogOpen, setIsFoundLocationDialogOpen] =
    useState(false);
  const [isManualFoundLocation, setIsManualFoundLocation] = useState(false);

  // 품종 검색 결과 필터링
  const filteredBreeds = breedList.filter((breed) =>
    breed.toLowerCase().includes(breedSearchTerm.toLowerCase())
  );
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

  const handleDetailAddressChange = (detailAddress: string) => {
    // 기존 주소가 있으면 합치고, 없으면 상세주소만 저장
    const currentLocation = data.foundLocation;
    if (currentLocation && !currentLocation.includes(detailAddress)) {
      onChange({ foundLocation: `${currentLocation} ${detailAddress}`.trim() });
    } else {
      onChange({ foundLocation: detailAddress });
    }
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
        <div className="flex gap-3 px-3 py-3 -mx-3 overflow-x-auto scrollbar-hide">
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
            <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
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
          <div className="flex flex-col gap-2">
            <div
              onClick={() => setIsFoundLocationDialogOpen(true)}
              className="cursor-pointer"
            >
              <SearchInput
                variant="variant2"
                placeholder="주소를 검색해보세요"
                value={data.foundLocation}
                onChange={(e) => onChange({ foundLocation: e.target.value })}
                onSearch={() => setIsFoundLocationDialogOpen(true)}
              />
            </div>
            <CustomInput
              variant="primary"
              placeholder="상세주소를 입력해주세요 (예: 101동 201호, 상가 1층)"
              value={data.foundLocation}
              onChange={(e) => handleDetailAddressChange(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-brand hover:underline"
                onClick={() => {
                  if (isManualFoundLocation) {
                    setIsManualFoundLocation(false);
                    handleFoundLocationSearch();
                  } else {
                    setIsManualFoundLocation(true);
                  }
                }}
              >
                {isManualFoundLocation
                  ? "주소 검색으로 전환"
                  : "직접 입력으로 전환"}
              </button>
            </div>
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
          <div className="overflow-y-auto max-h-60 scrollbar-hide">
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
              <p className="py-4 text-center text-gray-500">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* 발견장소 입력 방식 선택 모달 */}
      <CustomModal
        open={isFoundLocationDialogOpen}
        onClose={() => setIsFoundLocationDialogOpen(false)}
        title="발견장소 입력 방식 선택"
        description="어떻게 입력할까요?"
        variant="variant1"
        leftButtonText="직접입력"
        rightButtonText="카카오맵으로 입력"
        onLeftClick={() => {
          setIsManualFoundLocation(true);
          setIsFoundLocationDialogOpen(false);
        }}
        onRightClick={() => {
          setIsFoundLocationDialogOpen(false);
          setTimeout(() => {
            setIsManualFoundLocation(false);
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
