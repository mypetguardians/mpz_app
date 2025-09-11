"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useCreateContractTemplate } from "@/hooks";

export default function CenterProcessCreateContract() {
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

  const createContractTemplate = useCreateContractTemplate();

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
      await createContractTemplate.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        isActive: true,
      });

      setToast({
        show: true,
        message: "계약서 템플릿이 성공적으로 생성되었습니다.",
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
            <h4>계약서 만들기</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-4 min-h-[100px]">
        <CustomInput
          variant="primary"
          label="계약서 제목"
          placeholder="제목을 입력해주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required={true}
        />
        <CustomInput
          variant="primary"
          label="계약서 부가설명"
          placeholder="예) 꼼꼼히 확인 후 서명해주세요."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={false}
        />
        <div className="w-full flex flex-col gap-1">
          <h5 className="text-dg">내용</h5>
          <textarea
            placeholder="내용을 입력해주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex w-full rounded-md border border-lg px-4 py-3 h5 placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
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
