"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ArrowRight, UsersThree } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { CustomAlert } from "@/components/ui/CustomAlert";
import { SearchInput } from "@/components/ui/SearchInput";
import { CenterCardSkeleton } from "@/components/ui/CenterCardSkeleton";
import { useGetCenters } from "@/hooks/query/useGetCenters";
import { transformRawCenterToCenter } from "@/types/center";
import { openKakaoAddress } from "@/lib/openKakaoAddress";
import instance from "@/lib/axios-instance";

const INTRO_STORAGE_KEY = "mpz_event_intro_seen";

function shouldShowIntro(): boolean {
  const stored = localStorage.getItem(INTRO_STORAGE_KEY);
  if (!stored) return true;

  const seenAt = new Date(stored);
  const now = new Date();

  // 다음 날 09시 기준 리셋
  const resetAt = new Date(seenAt);
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(9, 0, 0, 0);

  return now >= resetAt;
}

/* ── 인트로 오버레이 ── */
function IntroOverlay({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"first" | "second" | "fade-out">("first");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("second"), 2800);
    const t2 = setTimeout(() => setPhase("fade-out"), 5600);
    const t3 = setTimeout(() => onDone(), 6400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#1A1008] flex items-center justify-center px-8 transition-opacity duration-700 ${
        phase === "fade-out" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 첫 번째 문장 */}
      <p
        className={`absolute text-center text-white text-[20px] font-semibold leading-relaxed transition-opacity duration-1000 ${
          phase === "first" ? "opacity-100" : "opacity-0"
        }`}
      >
        저는 <span className="text-orange-100">10년째</span> 가족이 없어요.
      </p>

      {/* 두 번째 문장 */}
      <p
        className={`absolute text-center text-white text-[18px] leading-relaxed transition-opacity duration-1000 ${
          phase === "second" ? "opacity-100" : "opacity-0"
        }`}
      >
        보호소에서 태어나고
        <br />
        보호소에서 죽는 아이들이
        <br />
        있다는 걸 아시나요?
      </p>
    </div>
  );
}

/* ── 센터 썸네일 ── */
function CenterThumbnail({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
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

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const a = digits.slice(0, 3);
  const b = digits.slice(3, 7);
  const c = digits.slice(7, 11);
  if (digits.length <= 3) return a;
  if (digits.length <= 7) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
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

  /* ── 인트로 상태 ── */
  const [introState, setIntroState] = useState<
    "pending" | "playing" | "reveal" | "done"
  >("pending");

  useEffect(() => {
    if (shouldShowIntro()) {
      setIntroState("playing");
    } else {
      setIntroState("reveal");
      setTimeout(() => setIntroState("done"), 50);
    }
  }, []);

  const handleIntroDone = useCallback(() => {
    localStorage.setItem(INTRO_STORAGE_KEY, new Date().toISOString());
    setIntroState("done");
  }, []);

  const [showAlert, setShowAlert] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const progress = window.scrollY / docHeight;
      setBgOpacity(Math.max(0, 1 - progress));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── 폼 상태 ── */
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
      await instance.post("/event/apply", {
        center_name: formData.centerName.trim(),
        owner_name: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        address_detail: formData.addressDetail.trim(),
        animal_count: formData.animalCount,
      });
      setShowAlert(true);
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
        message: "신청에 실패했어요. 다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {introState === "playing" && <IntroOverlay onDone={handleIntroDone} />}

      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.back()}
            />
            <h4 className="ml-2">보호센터 홍보 프로젝트</h4>
          </div>
        }
      />

      {/* 스크롤 연동 다크 배경 */}
      <div
        className="fixed inset-0 bg-[#5C3D0E] pointer-events-none z-0"
        style={{ opacity: bgOpacity * 0.4 }}
      />

      {introState === "pending" ? (
        <div className="min-h-screen" />
      ) : (
        <Container
          className={`min-h-screen pb-20 !bg-transparent transition-all duration-1000 ease-out ${
            introState === "done" || introState === "playing"
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >

          {/* 이벤트 설명 이미지 영역 */}
          <section className="px-4 mt-4 space-y-2.5">
            <div className="relative rounded-xl overflow-hidden">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src="/img/event-dog-grown.png"
                  alt="보호소의 새끼 강아지"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0">
                <div className="bg-[#1A1008]/60 backdrop-blur-[1px] px-4 py-3 rounded-b-xl">
                  <p className="text-xs text-orange-100 font-semibold mb-0.5">
                    어린시절 전 매일 창밖을 보며
                  </p>
                  <p className="text-sm text-white/90 leading-relaxed">
                    오늘은 내 가족이 올 거라고 믿었어요
                  </p>
                </div>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src="/img/event-screenshot.png"
                  alt="10년 후 같은 자리의 강아지"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0">
                <div className="bg-[#1A1008]/60 backdrop-blur-[1px] px-4 py-3 rounded-b-xl">
                  <p className="text-xs text-orange-100 font-semibold mb-0.5">
                    10년 후, 같은 자리
                  </p>
                  <p className="text-sm text-white/90 leading-relaxed">
                    저는 아직도 가족을 기다리고있어요
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 섹션 분리 헤더 */}
          <section className="mt-8 mb-6 bg-[#1A1008] px-5 py-6">
            <h3 className="text-[18px] font-semibold text-white leading-relaxed">
              평생을 바쳐 이 아이들을 돌보는
              <br />
              사람들이 있어요.
            </h3>
            <p className="text-sm text-white/60 mt-1.5">
              센터와 동물들에게 관심을 가져주세요.
            </p>
          </section>

          {/* 참여 중 보호센터 리스트 */}
          <section className="px-4">
            {centersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <CenterCardSkeleton key={i} />
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
                    <CenterThumbnail
                      imageUrl={center.imageUrl}
                      name={center.name}
                    />
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
                <p className="body text-gr">아직 참여 중인 센터가 없어요.</p>
              </div>
            )}
          </section>

          <div className="mx-4 border-b border-lg my-8" />

          {/* 보호센터 서비스 신청 폼 */}
          <section className="px-4">
            <h3 className="text-[18px] font-semibold text-bk mb-1">
              우리 센터 아이들을 더 많은 분께 알리고 싶으신가요?
            </h3>
            <p className="body2 text-gr leading-relaxed mb-6">
              마이펫가디언즈에 등록하면 이벤트 페이지에 우선 노출돼요.
              <br />
              신청 후 담당자가 2영업일 내 연락드릴게요.
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
                  onChange={(e) =>
                    handleFormChange("ownerName", e.target.value)
                  }
                  required
                  error={formErrors.ownerName}
                />
                <CustomInput
                  variant="primary"
                  label="연락처"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={(e) =>
                    handleFormChange("phone", formatPhone(e.target.value))
                  }
                  type="tel"
                  inputMode="tel"
                  required
                  error={formErrors.phone}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h5
                  className={`text-dg ${
                    formErrors.address ? "text-error" : ""
                  }`}
                >
                  센터 위치 <span className="text-brand ml-1">*</span>
                </h5>
                <SearchInput
                  variant="variant2"
                  className="!bg-gray-200"
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
                onChangeOption={(value) =>
                  handleFormChange("animalCount", value)
                }
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
              개인정보 수집 및 이용에 동의해요. 수집된 정보는 서비스 안내
              목적으로만 사용돼요.
            </label>

            <BigButton
              variant="primary"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreed}
            >
              {isSubmitting ? "신청 중..." : "신청하기"}
            </BigButton>
          </section>
        </Container>
      )}

      <CustomAlert
        open={showAlert}
        onClose={() => setShowAlert(false)}
        variant="center"
        title="신청 완료"
        description={"신청이 완료됐어요.\n담당자가 2영업일 내 문자로 연락드릴게요."}
        confirmText="확인"
      />

      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}
