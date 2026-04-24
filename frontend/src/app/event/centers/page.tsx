"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { NotificationToast } from "@/components/ui/NotificationToast";

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
    region: "",
    animalCount: "",
    introduction: "",
    agreed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.centerName.trim() || !formData.phone.trim()) {
      setToast({ show: true, message: "필수 항목을 입력해주세요.", type: "error" });
      return;
    }
    if (!formData.agreed) {
      setToast({ show: true, message: "개인정보 수집에 동의해주세요.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: 백엔드 API 연동 (/v1/event/apply)
      alert("신청이 완료되었습니다.\n담당자가 2영업일 내 연락드리겠습니다.");
      setFormData({
        centerName: "",
        ownerName: "",
        phone: "",
        region: "",
        animalCount: "",
        introduction: "",
        agreed: false,
      });
    } catch {
      setToast({ show: true, message: "신청에 실패했습니다. 다시 시도해주세요.", type: "error" });
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

      {/* 스토리 블록 */}
      <section className="px-4">
          {/* Lv1: 핵심 헤드라인 */}
          <h2 className="text-[18px] font-bold text-[#707070] leading-snug mb-2">
            저는 <span className="text-orange-100">10년째</span> 가족이 없어요.
          </h2>
          {/* Lv3: 보조 설명 */}
          <p className="body text-dg leading-relaxed">
            보호소에서 태어나서 보호소에서 죽는 아이들이 있다는 걸 아시나요?
          </p>

          {/* 만화 패널 2컷 */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <div className="bg-wh rounded-xl border border-lg overflow-hidden">
              <div className="h-36 bg-gray-100 flex items-center justify-center">
                <span className="text-gr text-xs">일러스트 1</span>
              </div>
              <div className="p-2.5">
                <p className="text-xs text-orange-100 font-medium mb-0.5">어린 시절</p>
                <p className="body2 text-gr leading-relaxed">
                  <span className="text-dg font-medium">매일 창문 앞에 앉아</span> 오늘은 내 가족이 올 거라고 믿었어요.
                </p>
              </div>
            </div>
            <div className="bg-wh rounded-xl border border-lg overflow-hidden">
              <div className="h-36 bg-gray-100 flex items-center justify-center">
                <span className="text-gr text-xs">일러스트 2</span>
              </div>
              <div className="p-2.5">
                <p className="text-xs text-orange-100 font-medium mb-0.5">10년 후, 같은 자리</p>
                <p className="body2 text-gr leading-relaxed">
                  창문도, 자리도 그대로예요. <span className="text-dg font-medium">아직도 기다리고 있어요.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-7 h-0.5 bg-orange-100 rounded my-5" />

          {/* Lv2: 중간 강조 */}
          <h3 className="text-base font-semibold text-bk leading-relaxed">
            평생을 바쳐 이 아이들 곁을 지키는<br />사람들이 있어요.
          </h3>
          <p className="body2 text-gr mt-1.5">
            센터와 동물들에게 관심을 가져주세요.
          </p>

          <div className="mt-5">
            {/* Lv2: 행동 유도 */}
            <h3 className="text-base font-semibold text-bk mb-3">
              당신이 그 가족이 될 수 있어요.
            </h3>

            {/* TODO: CTA 이동 경로 대표님 확인 후 설정 */}
            <button
              className="w-full flex items-center justify-center bg-orange-100 text-wh text-sm font-medium py-3 rounded-xl"
              onClick={() => router.push("/list/animal")}
            >
              아이들 만나러 가기 <ArrowRight size={14} className="ml-2" />
            </button>

            <div className="flex items-center mt-3">
              <span className="inline-flex items-center bg-orange-50 text-orange-100 text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-100 mr-1.5" />
                입양 · 임시보호 모두 가능
              </span>
              <span className="inline-flex items-center bg-orange-50 text-orange-100 text-xs font-medium px-3 py-1.5 rounded-full ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-100 mr-1.5" />
                전국 센터 한눈에
              </span>
            </div>
          </div>

        <div className="border-b border-lg mt-5" />
      </section>

      {/* 참여 센터 리스트 */}
      <section className="px-4 mt-8">
        <h3 className="text-base font-semibold text-bk mb-1">참여 민간 보호센터</h3>
        <p className="body2 text-gr mb-4">센터를 클릭하면 보호 중인 아이들을 확인할 수 있어요</p>

        {/* TODO: DB에서 민간센터 목록 가져오기 */}
        <div className="grid grid-cols-2 gap-2.5">
          <p className="col-span-2 text-center body text-gr py-10">
            참여 센터 목록을 불러오는 중...
          </p>
        </div>
      </section>

      <div className="mx-4 border-b border-lg my-8" />

      {/* 보호센터 서비스 신청 폼 */}
      <section className="px-4">
        <h3 className="text-base font-semibold text-bk mb-1">
          우리 센터 아이들을 더 많은 분께 알리고 싶으신가요?
        </h3>
        <p className="body2 text-gr leading-relaxed mb-6">
          마이펫가디언즈에 등록하면 이벤트 페이지에 우선 노출돼요.
          <br />신청 후 담당자가 2영업일 내 연락드립니다.
        </p>

        <div className="space-y-4">
          <CustomInput
            variant="primary"
            label="센터명"
            placeholder="예) 포포네 임시보호센터"
            value={formData.centerName}
            onChange={(e) => handleFormChange("centerName", e.target.value)}
            required
          />
          <CustomInput
            variant="primary"
            label="운영자 이름"
            placeholder="홍길동"
            value={formData.ownerName}
            onChange={(e) => handleFormChange("ownerName", e.target.value)}
          />
          <CustomInput
            variant="primary"
            label="연락처"
            placeholder="010-0000-0000"
            value={formData.phone}
            onChange={(e) => handleFormChange("phone", e.target.value)}
            required
          />
          <CustomInput
            variant="primary"
            label="센터 위치"
            placeholder="시/도 선택"
            value={formData.region}
            onChange={(e) => handleFormChange("region", e.target.value)}
          />
          <CustomInput
            variant="primary"
            label="현재 보호 중인 동물 수"
            placeholder="예) 10마리"
            value={formData.animalCount}
            onChange={(e) => handleFormChange("animalCount", e.target.value)}
          />
          <CustomInput
            variant="primary"
            label="한 줄 소개 (선택)"
            placeholder="우리 센터를 간단히 소개해주세요."
            value={formData.introduction}
            onChange={(e) => handleFormChange("introduction", e.target.value)}
            multiline
            rows={3}
          />
        </div>

        <label className="flex items-start mt-5 mb-5 body2 text-gr leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 mr-2"
            checked={formData.agreed}
            onChange={(e) => handleFormChange("agreed", e.target.checked)}
          />
          개인정보 수집 및 이용에 동의합니다. 수집된 정보는 서비스 안내 목적으로만 사용됩니다.
        </label>

        <BigButton
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "신청 중..." : "신청하기"}
        </BigButton>

      </section>

      {/* 유의사항 */}
      <section className="px-4 mt-8 mb-8">
        <div className="bg-bg p-4 rounded-lg">
          <p className="text-xs font-semibold text-dg mb-2">유의사항</p>
          <div className="space-y-1">
            <p className="text-[11px] text-gr leading-relaxed">· 신청 센터는 이벤트 페이지에 우선 노출됩니다.</p>
            <p className="text-[11px] text-gr leading-relaxed">· 무료 서비스 체험이 자동 포함됩니다.</p>
            <p className="text-[11px] text-gr leading-relaxed">· 신청 후 담당자가 2영업일 내 연락드립니다.</p>
            <p className="text-[11px] text-gr leading-relaxed">· 등록된 정보는 서비스 안내 목적으로만 사용됩니다.</p>
          </div>
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
