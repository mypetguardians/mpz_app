"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, UsersThree } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { SearchInput } from "@/components/ui/SearchInput";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { transformRawCenterToCenter } from "@/types/center";
import { openKakaoAddress } from "@/lib/openKakaoAddress";

function CenterThumbnail({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);
  const hasValidImage = imageUrl && imageUrl.trim() !== "" && !hasError;

  return (
    <div className="relative w-[63px] h-[63px] rounded-md border border-lg overflow-hidden flex-shrink-0 bg-gray-300 flex items-center justify-center mr-3">
      {hasValidImage ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="63px"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <UsersThree size={32} className="text-gray-500" weight="light" />
      )}
    </div>
  );
}

const ANIMAL_COUNT_OPTIONS = [
  "1 ~ 10",
  "11 ~ 30",
  "31 ~ 80",
  "81 ~ 100",
  "101 ~ 200",
  "200마리 이상",
];

export default function EventCentersPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    centerName: "",
    ownerName: "",
    phone: "",
    address: "",
    addressDetail: "",
    animalCount: "",
    agreed: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 민간센터 목록 조회
  const { data: centersData, isLoading: centersLoading } = useGetCenters({
    is_public: false,
  });

  const centers =
    centersData?.pages
      .flatMap((page) => page.data || [])
      .map(transformRawCenterToCenter) ?? [];

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleAddressSearch = () => {
    openKakaoAddress((address) => {
      handleFormChange("address", address);
    });
  };

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    if (!formData.centerName.trim()) errors.centerName = true;
    if (!formData.ownerName.trim()) errors.ownerName = true;
    if (!formData.phone.trim()) errors.phone = true;
    if (!formData.address.trim()) errors.address = true;
    if (!formData.animalCount) errors.animalCount = true;

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setToast({
        show: true,
        message: "필수 항목을 모두 입력해주세요.",
        type: "error",
      });
      return false;
    }

    // 연락처 형식 검증
    const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setFormErrors((prev) => ({ ...prev, phone: true }));
      setToast({
        show: true,
        message: "연락처 형식을 확인해주세요. (예: 010-0000-0000)",
        type: "error",
      });
      return false;
    }

    if (!formData.agreed) {
      setToast({
        show: true,
        message: "개인정보 수집에 동의해주세요.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: 백엔드 API 연동 (/v1/event/apply)
      alert(
        "신청이 완료되었습니다.\n담당자가 2영업일 내 문자로 연락드립니다."
      );
      setFormData({
        centerName: "",
        ownerName: "",
        phone: "",
        address: "",
        addressDetail: "",
        animalCount: "",
        agreed: false,
      });
      setFormErrors({});
    } catch {
      setToast({
        show: true,
        message: "신청에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="min-h-screen pb-20">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.back()}
            />
            <h4 className="ml-2">이벤트</h4>
          </div>
        }
      />

      {/* 이벤트 설명 이미지 영역 */}
      <section className="relative w-full">
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src="/img/event-screenshot.png"
            alt="보호소에서 가족을 기다리는 아이"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-[18px] font-bold text-white leading-snug mb-1">
              보호소에서 태어나서
              <br />
              보호소에서 죽는 아이들이 있어요.
            </h2>
            <p className="text-[13px] text-white/80">
              민간보호센터 아이들을 만나보세요.
            </p>
          </div>
        </div>
      </section>

      {/* 참여 중 보호센터 리스트 */}
      <section className="px-4 mt-8">
        <h3 className="text-base font-semibold text-bk mb-1">
          참여 중 보호센터
        </h3>
        <p className="body2 text-gr mb-4">
          센터를 클릭하면 보호 중인 아이들을 확인할 수 있어요
        </p>

        {centersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center bg-wh rounded-xl border border-lg p-3 animate-pulse"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-200 mr-3" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : centers.length > 0 ? (
          <div className="space-y-3">
            {centers.map((center) => (
              <button
                key={center.id}
                type="button"
                className="w-full flex items-center bg-wh rounded-xl border border-lg p-3 text-left"
                onClick={() => router.push(`/list/center/${center.id}`)}
              >
                <CenterThumbnail imageUrl={center.imageUrl} name={center.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-bk truncate">
                    {center.name}
                  </p>
                  <p className="body2 text-gr mt-0.5">
                    {center.region || "지역 미등록"}
                  </p>
                </div>
                <div className="flex items-center text-gr ml-2">
                  <span className="body2">보러가기</span>
                  <ArrowRight size={12} className="ml-0.5" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="body text-gr">아직 참여 중인 센터가 없습니다.</p>
          </div>
        )}
      </section>

      <div className="mx-4 border-b border-lg my-8" />

      {/* 보호센터 서비스 신청 폼 */}
      <section className="px-4">
        <span className="inline-flex items-center bg-orange-50 text-orange-100 text-[11px] font-medium px-3 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-100 mr-1.5" />
          무료 서비스 체험 제공
        </span>

        <h3 className="text-base font-semibold text-bk mb-1">
          우리 센터 아이들을 더 많은 분께 알리고 싶으신가요?
        </h3>
        <p className="body2 text-gr leading-relaxed mb-6">
          마이펫가디언즈에 등록하면 이벤트 페이지에 우선 노출돼요.
          <br />
          신청 후 담당자가 2영업일 내 연락드립니다.
        </p>

        <div className="space-y-4">
          <CustomInput
            variant="primary"
            label="센터명"
            placeholder="예) 포포네 센터"
            value={formData.centerName}
            onChange={(e) => handleFormChange("centerName", e.target.value)}
            required
            error={formErrors.centerName}
          />

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              variant="primary"
              label="운영자 이름"
              placeholder="홍길동"
              value={formData.ownerName}
              onChange={(e) => handleFormChange("ownerName", e.target.value)}
              required
              error={formErrors.ownerName}
            />
            <CustomInput
              variant="primary"
              label="연락처"
              placeholder="010-0000-0000"
              value={formData.phone}
              onChange={(e) => handleFormChange("phone", e.target.value)}
              inputMode="tel"
              required
              error={formErrors.phone}
            />
          </div>

          <div className="flex flex-col gap-2">
            <h5 className={`text-dg ${formErrors.address ? "text-error" : ""}`}>
              센터 위치 <span className="text-brand ml-1">*</span>
            </h5>
            <SearchInput
              variant="variant2"
              placeholder="센터 주소를 검색해주세요."
              value={formData.address}
              onChange={(e) => handleFormChange("address", e.target.value)}
              onSearch={handleAddressSearch}
            />
            <CustomInput
              variant="primary"
              placeholder="상세주소를 입력해주세요."
              value={formData.addressDetail}
              onChange={(e) =>
                handleFormChange("addressDetail", e.target.value)
              }
            />
          </div>

          <CustomInput
            variant="bottomsheet"
            label="보호 중인 동물 수"
            placeholder="선택"
            value={formData.animalCount}
            onChangeOption={(value) => handleFormChange("animalCount", value)}
            options={ANIMAL_COUNT_OPTIONS}
            required
            error={formErrors.animalCount}
          />
        </div>

        <label className="flex items-start mt-5 mb-5 body2 text-gr leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 mr-2"
            checked={formData.agreed}
            onChange={(e) => handleFormChange("agreed", e.target.checked)}
          />
          개인정보 수집 및 이용에 동의합니다. 수집된 정보는 서비스 안내
          목적으로만 사용됩니다.
        </label>

        <BigButton
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.agreed}
        >
          {isSubmitting ? "신청 중..." : "신청하기"}
        </BigButton>

        <div className="flex items-start mt-4 p-3 bg-bg rounded-lg">
          <span className="text-orange-100 text-sm mr-2 mt-px">✓</span>
          <p className="text-[11px] text-gr leading-relaxed">
            신청 센터는 이벤트 페이지에{" "}
            <span className="text-orange-100">우선 노출</span>됩니다 · 무료
            서비스 체험 자동 포함
          </p>
        </div>
      </section>

      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </Container>
  );
}
