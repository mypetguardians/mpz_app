"use client";

import { useState, useRef } from "react";
import { ImageCard } from "@/components/ui/ImageCard";
import { CustomInput } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { AddButton } from "@/components/ui/AddButton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { breed } from "@/app/mock";
import { MiniButton } from "@/components/ui";

interface BasicInfoData {
  status: string;
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
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [breedSearchTerm, setBreedSearchTerm] = useState("");
  const [tempSelectedBreed, setTempSelectedBreed] = useState("");
  const [tempSelectedDate, setTempSelectedDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBreedSearchClick = () => {
    setTempSelectedBreed(data.breed);
    setIsBreedSheetOpen(true);
  };

  const handleDateSelectClick = () => {
    setTempSelectedDate(data.centerEntryDate);
    setIsDateSheetOpen(true);
  };

  const handleBreedSelect = (breed: string) => {
    setTempSelectedBreed(breed);
  };

  const handleBreedApply = (breed: string) => {
    onChange({ breed });
    setIsBreedSheetOpen(false);
    setBreedSearchTerm("");
  };

  const handleDateApply = (date: string) => {
    onChange({ centerEntryDate: date });
    setIsDateSheetOpen(false);
  };

  const filteredBreeds = breed.filter((b) =>
    b.toLowerCase().includes(breedSearchTerm.toLowerCase())
  );

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      if (images.length + newImages.length <= 5) {
        onImagesChange([...images, ...newImages]);
      } else {
        alert("최대 5장까지만 업로드할 수 있습니다.");
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 현재 년도 기준으로 년도 배열 생성
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {images.map((image, index) => (
            <ImageCard
              key={index}
              src={getImagePreview(image)}
              alt={`이미지 ${index + 1}`}
              onRemove={() => handleRemoveImage(index)}
            />
          ))}
          {images.length < 5 && (
            <ImageCard variant="add" onClick={handleAddImage} />
          )}
        </div>

        <CustomInput
          variant="tagdropdown"
          label="상태"
          placeholder="상태를 선택해주세요"
          options={["보호중", "임시보호중", "입양완료", "무지개다리"]}
          value={data.status}
          onChangeOption={(value) => onChange({ status: value })}
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
          placeholder="년생을 입력해주세요."
          value={data.age}
          onChange={(e) => onChange({ age: e.target.value })}
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
          placeholder="숫자를 입력해주세요."
          value={data.weight}
          onChange={(e) => onChange({ weight: e.target.value })}
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
        <CustomInput
          variant="primary"
          label="발견장소"
          placeholder="확실하지 않다면 추정으로 입력해주세요."
          value={data.foundLocation}
          onChange={(e) => onChange({ foundLocation: e.target.value })}
        />
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
        <AddButton>특징 추가</AddButton>

        {/* 센터 입소일 - 날짜 선택 */}
        <div className="flex flex-col gap-2">
          <h5 className="text-dg">
            센터 입소일 <span className="text-brand">*</span>
          </h5>
          <div onClick={handleDateSelectClick} className="cursor-pointer">
            <div className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background focus-visible:outline-none focus-visible:border-brand">
              <span className={data.centerEntryDate ? "text-bk" : "text-gr"}>
                {data.centerEntryDate
                  ? formatDate(data.centerEntryDate)
                  : "센터에 들어온 날을 선택해주세요."}
              </span>
            </div>
          </div>
        </div>
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
            placeholder="품종을 검색해보세요"
            value={breedSearchTerm}
            onChange={(e) => setBreedSearchTerm(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredBreeds.length > 0 ? (
              <div className="flex flex-col">
                {filteredBreeds.map((breedItem, index) => (
                  <button
                    key={index}
                    className={`text-left p-3 rounded-lg transition-colors ${
                      tempSelectedBreed === breedItem
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
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

      {/* 날짜 선택 BottomSheet */}
      <BottomSheet
        open={isDateSheetOpen}
        onClose={() => setIsDateSheetOpen(false)}
        variant="selectMenu"
        showApplyButton={true}
        applyButtonText="적용하기"
        onApply={handleDateApply}
        selectedValue={tempSelectedDate}
      >
        <div className="flex flex-col gap-4">
          <h5 className="text-center text-lg font-medium mt-3">
            센터 입소일 선택
          </h5>

          {/* 년도 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">년도</label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {years.map((year) => (
                <MiniButton
                  key={year}
                  text={`${year}년`}
                  variant={
                    tempSelectedDate &&
                    new Date(tempSelectedDate).getFullYear() === year
                      ? "filterOn"
                      : "filterOff"
                  }
                  onClick={() => {
                    if (tempSelectedDate) {
                      const date = new Date(tempSelectedDate);
                      date.setFullYear(year);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    } else {
                      const date = new Date(year, 0, 1);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* 월 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">월</label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month) => (
                <MiniButton
                  key={month}
                  text={`${month}월`}
                  variant={
                    tempSelectedDate &&
                    new Date(tempSelectedDate).getMonth() + 1 === month
                      ? "filterOn"
                      : "filterOff"
                  }
                  onClick={() => {
                    if (tempSelectedDate) {
                      const date = new Date(tempSelectedDate);
                      date.setMonth(month - 1);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    } else {
                      const date = new Date(currentYear, month - 1, 1);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* 일 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">일</label>
            <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
              {days.map((day) => (
                <MiniButton
                  key={day}
                  text={`${day}일`}
                  variant={
                    tempSelectedDate &&
                    new Date(tempSelectedDate).getDate() === day
                      ? "filterOn"
                      : "filterOff"
                  }
                  onClick={() => {
                    if (tempSelectedDate) {
                      const date = new Date(tempSelectedDate);
                      date.setDate(day);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    } else {
                      const date = new Date(currentYear, 0, day);
                      setTempSelectedDate(date.toISOString().split("T")[0]);
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* 선택된 날짜 표시 */}
          {tempSelectedDate && (
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">선택된 날짜</p>
              <p className="font-medium">{formatDate(tempSelectedDate)}</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
