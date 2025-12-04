"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useCreateConsent } from "@/hooks";
import instance from "@/lib/axios-instance";

export default function CenterProcessCreateConsent() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const createConsent = useCreateConsent();

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setToast({
        show: true,
        message: "제목과 내용을 모두 입력해주세요.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await createConsent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        is_active: true,
      });

      setToast({
        show: true,
        message: "동의서가 성공적으로 생성되었습니다.",
        type: "success",
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("저장 실패:", error);
      setToast({
        show: true,
        message: "저장에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = async () => {
    try {
      // 내 센터의 동의서 목록 조회
      const res = await instance.get<
        Array<{
          id: string;
          title: string;
          description?: string;
          content: string;
          is_active: boolean;
          created_at: string;
        }>
      >("/centers/procedures/consent/");
      const consents = res.data || [];
      if (consents.length === 0) {
        setToast({
          show: true,
          message: "불러올 동의서 템플릿이 없습니다.",
          type: "error",
        });
        return;
      }
      // 활성 우선, 없으면 가장 최근
      const active = consents.find((c) => c.is_active);
      const picked = active ?? consents[0];
      setTitle(picked.title || "");
      setDescription(picked.description || "");
      setContent(picked.content || "");
      setToast({
        show: true,
        message: "템플릿을 불러왔습니다.",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      setToast({
        show: true,
        message: "템플릿 불러오기에 실패했습니다.",
        type: "error",
      });
    }
  };

  return (
    <Container className="min-h-screen">
      <TopBar
        variant="variant4"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={handleBack}
            />
            <h4>유의사항 동의서 만들기</h4>
          </div>
        }
        right={
          <div className="flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={handleLoadTemplate}
              className="text-sm text-brand underline underline-offset-4"
            >
              템플릿 불러오기
            </button>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-4 min-h-[100px]">
        <InfoCard>
          예비 입양자가 필수로 유의할 사항을 입력하면 돼요. 입양자에겐
          동의/비동의 형태로 보여질 거예요.
        </InfoCard>
        <CustomInput
          variant="primary"
          label="동의서 제목"
          placeholder="제목을 입력해주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={true}
        />
        <CustomInput
          variant="primary"
          label="동의서 부가설명"
          placeholder="예) 입양 전 꼭 확인해주세요."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={false}
        />
        <div className="w-full flex flex-col gap-1">
          <h5 className="text-dg">내용</h5>
          <textarea
            placeholder="예) 입양 후 n개월간 센터의 요청에 응답하지 않을 시, 임의로 입양을 취소할 수 있습니다."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex w-full rounded-md border border-lg px-4 py-3 h5 placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[200px] focus:outline-none"
          />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5">
        <BigButton
          className="w-full"
          onClick={handleSave}
          disabled={!title.trim() || !content.trim() || isLoading}
        >
          {isLoading ? "저장 중..." : "저장하기"}
        </BigButton>
      </div>

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
