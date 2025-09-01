"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { ImageCard } from "@/components/ui/ImageCard";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { Toast } from "@/components/ui/Toast";
import { useGetMyCenter } from "@/hooks/query/useGetMyCenter";
import { useUpdateCenterSettings } from "@/hooks/mutation/useUpdateCenterSettings";
import { useUploadSingleImage } from "@/hooks/mutation/useUploadSingleImage";

export default function CenterSettingName() {
  const router = useRouter();
  const { data: myCenter, isLoading } = useGetMyCenter();
  const updateCenterSettings = useUpdateCenterSettings();
  const uploadSingleImage = useUploadSingleImage();

  // 폼 상태
  const [centerName, setCenterName] = useState("");
  const [centerNumber, setCenterNumber] = useState("");
  const [isPublicNumber, setIsPublicNumber] = useState("모두에게 공개");
  const [address, setAddress] = useState("");
  const [isPublicAddress, setIsPublicAddress] = useState("모두에게 공개");
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
      setCenterNumber(myCenter.centerNumber || "");
      setIsPublicNumber(
        myCenter.isPublic ? "모두에게 공개" : "입양자에게만 공개"
      );
      setAddress(myCenter.location || "");
      setIsPublicAddress(
        myCenter.isPublic ? "모두에게 공개" : "입양자에게만 공개"
      );
      setAdoptionPrice(myCenter.adoptionPrice?.toString() || "");
      setCenterImage(myCenter.imageUrl || "");
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

    if (!address.trim()) {
      showToastMessage("보호센터 주소를 입력해주세요.");
      return;
    }

    if (!adoptionPrice.trim()) {
      showToastMessage("책임비를 입력해주세요.");
      return;
    }

    try {
      let imageUrl = centerImage;

      // 새로운 이미지가 선택된 경우 업로드
      if (selectedFile) {
        showToastMessage("이미지를 업로드하는 중...");
        imageUrl = await uploadSingleImage.mutateAsync(selectedFile);
      }

      await updateCenterSettings.mutateAsync({
        name: centerName.trim(),
        centerNumber: centerNumber.trim() || undefined,
        location: address.trim(),
        isPublic:
          isPublicNumber === "모두에게 공개" &&
          isPublicAddress === "모두에게 공개",
        adoptionPrice: parseInt(adoptionPrice.replace(/,/g, ""), 10),
        imageUrl: imageUrl || undefined,
      });

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

  if (isLoading) {
    return (
      <Container className="min-h-screen relative">
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
      <Container className="min-h-screen relative">
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
    <Container className="min-h-screen relative">
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
          label="보호센터 번호"
          placeholder="000-0000-0000"
          required={false}
          value={centerNumber}
          onChange={(e) => setCenterNumber(e.target.value)}
        />
        <CustomInput
          variant="Variant7"
          value={isPublicNumber}
          onChangeOption={setIsPublicNumber}
          twoOptions={["모두에게 공개", "입양자에게만 공개"]}
          required={true}
        />
        <div className="flex flex-col gap-3">
          <h5 className="text-dg">
            보호센터 주소 <span className="text-brand">*</span>
          </h5>
          <CustomInput
            variant="primary"
            placeholder="보호센터 주소를 입력해주세요."
            required={true}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <CustomInput
            variant="Variant7"
            value={isPublicAddress}
            onChangeOption={setIsPublicAddress}
            twoOptions={["모두에게 공개", "입양자에게만 공개"]}
            required={true}
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
        </div>
      </div>
      <div className="sticky bottom-0 left-0 right-0 pb-6 pt-2 px-5">
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
