"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { ImageCard } from "@/components/ui/ImageCard";
import { CustomInput } from "@/components/ui/CustomInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { BigButton } from "@/components/ui/BigButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { Toast } from "@/components/ui/Toast";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";
import { useUpdateCenterSettings } from "@/hooks/mutation/useUpdateCenterSettings";
import { useUploadSingleImage } from "@/hooks/mutation/useUploadSingleImage";
import { openKakaoAddress } from "@/lib/openKakaoAddress";

export default function CenterSettingName() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: myCenter, isLoading } = useGetMyCenter();
  const updateCenterSettings = useUpdateCenterSettings();
  const uploadSingleImage = useUploadSingleImage();

  // 폼 상태
  const [centerName, setCenterName] = useState("");
  const [centerPhoneNumber, setCenterPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [callAvailableTime, setCallAvailableTime] = useState("");
  const [isPublicAddress, setIsPublicAddress] = useState("모두에게 공개");
  const [isTemporaryAdoption, setIsTemporaryAdoption] = useState("가능");
  const [isVolunteering, setIsVolunteering] = useState("가능");
  const [adoptionPrice, setAdoptionPrice] = useState("");
  const [centerImage, setCenterImage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 토스트 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 토스트 표시 함수
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 센터 정보가 로드되면 폼에 미리 채우기
  useEffect(() => {
    if (myCenter) {
      setCenterName(myCenter.name || "");
      setCenterPhoneNumber(myCenter.phoneNumber || "");
      setAddress(myCenter.location || "");
      setCallAvailableTime(myCenter.callAvailableTime || "");
      setIsPublicAddress(
        myCenter.isPublic ? "모두에게 공개" : "입양자에게만 공개"
      );
      setAdoptionPrice(
        myCenter.adoptionPrice ? myCenter.adoptionPrice.toLocaleString() : ""
      );
      setCenterImage(myCenter.imageUrl || "");
      setIsTemporaryAdoption(myCenter.hasFosterCare ? "가능" : "불가능");
      setIsVolunteering(myCenter.hasVolunteer ? "가능" : "불가능");
    }
  }, [myCenter]);

  const handleBack = () => {
    router.back();
  };

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    // 미리보기용 URL 생성
    const previewUrl = URL.createObjectURL(file);
    setCenterImage(previewUrl);
  };

  const handleImageClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageSelect(file);
      }
    };
    input.click();
  };

  const handleImageRemove = () => {
    setCenterImage("");
    setSelectedFile(null);
  };

  const handleSave = async () => {
    if (!myCenter) return;

    // 필수 필드 검증
    if (!centerName.trim()) {
      showToastMessage("보호센터 이름을 입력해주세요.");
      return;
    }

    if (!centerPhoneNumber.trim()) {
      showToastMessage("보호센터 전화번호를 입력해주세요.");
      return;
    }

    if (!address.trim()) {
      showToastMessage("보호센터 주소를 입력해주세요.");
      return;
    }

    if (!adoptionPrice.trim()) {
      showToastMessage("책임비를 입력해주세요.");
      return;
    }

    if (!isTemporaryAdoption) {
      showToastMessage("임시보호 가능 여부를 선택해주세요.");
      return;
    }

    if (!isVolunteering) {
      showToastMessage("봉사활동 가능 여부를 선택해주세요.");
      return;
    }

    try {
      let imageUrl = "";
      let shouldUpdateImage = false;

      // 기존 이미지가 있고 blob URL이 아닌 경우 (실제 서버 URL)
      if (centerImage && !centerImage.startsWith("blob:")) {
        imageUrl = centerImage;
      } else if (!centerImage) {
        // 이미지가 제거된 경우
        shouldUpdateImage = true;
        imageUrl = "";
      }

      // 새로운 이미지가 선택된 경우 업로드
      if (selectedFile) {
        shouldUpdateImage = true;
        showToastMessage("이미지를 업로드하는 중...");

        // File을 base64로 변환
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // data:image/jpeg;base64, 부분 제거
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await uploadSingleImage.mutateAsync({
          file: base64,
          filename: selectedFile.name,
          content_type: selectedFile.type,
          folder: "centers",
        });

        imageUrl = uploadResult.file_url;
      }

      // 책임비 파싱 (안전하게 처리)
      const parsedAdoptionPrice = adoptionPrice.replace(/,/g, "");
      const adoptionPriceNumber = parsedAdoptionPrice
        ? parseInt(parsedAdoptionPrice, 10)
        : 0;

      if (isNaN(adoptionPriceNumber)) {
        showToastMessage("책임비는 숫자만 입력 가능합니다.");
        return;
      }

      const updateData = {
        name: centerName.trim(),
        phone_number: centerPhoneNumber.trim() || undefined,
        location: address.trim(),
        call_available_time: callAvailableTime.trim() || undefined,
        is_public: isPublicAddress === "모두에게 공개",
        adoption_price: adoptionPriceNumber,
        has_foster_care: isTemporaryAdoption === "가능",
        has_volunteer: isVolunteering === "가능",
        ...(shouldUpdateImage && { image_url: imageUrl }), // 이미지가 변경된 경우에만 포함
      };

      await updateCenterSettings.mutateAsync(updateData);

      // 추가 캐시 무효화 및 리페치
      await queryClient.invalidateQueries({ queryKey: ["myCenter"] });
      await queryClient.refetchQueries({ queryKey: ["myCenter"] });

      showToastMessage("센터 정보가 성공적으로 업데이트되었습니다.");
      setTimeout(() => {
        router.push("/centerpage");
      }, 2000);
    } catch (error) {
      console.error("센터 정보 업데이트 오류:", error);
      showToastMessage(
        error instanceof Error
          ? error.message
          : "센터 정보 업데이트 중 오류가 발생했습니다."
      );
    }
  };

  const handleAdoptionPriceChange = (value: string) => {
    // 숫자만 입력 가능하도록
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue) {
      // 천 단위 콤마 추가
      const formattedValue = parseInt(numericValue, 10).toLocaleString();
      setAdoptionPrice(formattedValue);
    } else {
      setAdoptionPrice("");
    }
  };

  const handleAddressSearch = () => {
    openKakaoAddress((selectedAddress) => {
      setAddress(selectedAddress);
    });
  };

  if (isLoading) {
    return (
      <Container className="relative min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>센터 정보 수정</h4>
            </div>
          }
        />
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-dg">로딩 중...</div>
        </div>
      </Container>
    );
  }

  if (!myCenter) {
    return (
      <Container className="relative min-h-screen">
        <TopBar
          variant="variant4"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={handleBack}
              />
              <h4>센터 정보 수정</h4>
            </div>
          }
        />
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="text-dg">보호센터를 찾을 수 없습니다.</div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="relative min-h-screen">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>센터 정보 수정</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col pb-3 px-4 gap-4 min-h-[100px]">
        <ImageCard
          variant={centerImage ? "primary" : "add"}
          src={centerImage}
          alt="센터 이미지"
          onClick={handleImageClick}
          onRemove={centerImage ? handleImageRemove : undefined}
        />
        <InfoCard>
          이미지는 JPG/PNG/WEBP/GIF 형식, 최대 3MB까지 업로드 가능합니다.
        </InfoCard>
        <CustomInput
          variant="primary"
          label="보호센터 이름"
          placeholder="보호센터 이름을 입력해주세요."
          required={true}
          value={centerName}
          onChange={(e) => setCenterName(e.target.value)}
        />
        <CustomInput
          variant="primary"
          label="보호센터 전화번호"
          placeholder="보호센터 전화번호를 입력해주세요."
          required={true}
          value={centerPhoneNumber}
          onChange={(e) => setCenterPhoneNumber(e.target.value)}
        />
        <div className="flex flex-col gap-3">
          <h5 className="text-dg">
            보호센터 주소 <span className="text-brand">*</span>
          </h5>
          <div className="flex flex-col">
            <SearchInput
              variant="variant2"
              placeholder="보호센터 주소를 입력해주세요."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onSearch={handleAddressSearch}
            />
            <CustomInput
              variant="primary"
              placeholder="상세주소를 입력해주세요."
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
            />
          </div>
          <CustomInput
            variant="primary"
            label="통화 가능 시간"
            placeholder="예) 평일 09:00-18:00, 주말 10:00-16:00"
            value={callAvailableTime}
            onChange={(e) => setCallAvailableTime(e.target.value)}
          />
          <CustomInput
            variant="primary"
            label="책임비"
            placeholder="예)100,000"
            required={true}
            value={adoptionPrice}
            onChange={(e) => handleAdoptionPriceChange(e.target.value)}
          />
          <InfoCard>책임비는 외부에 노출되지 않으니 안심하세요.</InfoCard>
          <h5 className="text-dg">
            임시보호 가능 여부 <span className="text-brand">*</span>
          </h5>
          {/*   {isSubscriber && ( */}
          <CustomInput
            variant="Variant7"
            value={isTemporaryAdoption}
            onChangeOption={setIsTemporaryAdoption}
            twoOptions={["가능", "불가능"]}
            required={true}
          />
          {/* )} */}
          <h5 className="text-dg">
            봉사활동 가능 여부 <span className="text-brand">*</span>
          </h5>
          {/*   {isSubscriber && ( */}
          <CustomInput
            variant="Variant7"
            value={isVolunteering}
            onChangeOption={setIsVolunteering}
            twoOptions={["가능", "불가능"]}
            required={true}
          />
          {/*  )} */}
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 px-5 pt-2 pb-6">
        <BigButton
          className="w-full"
          onClick={handleSave}
          disabled={
            updateCenterSettings.isPending || uploadSingleImage.isPending
          }
        >
          {uploadSingleImage.isPending
            ? "이미지 업로드 중..."
            : updateCenterSettings.isPending
            ? "저장 중..."
            : "저장하기"}
        </BigButton>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </Container>
  );
}
