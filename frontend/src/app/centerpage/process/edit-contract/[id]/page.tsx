"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter, useParams } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { NotificationToast } from "@/components/ui/NotificationToast";
import {
  useGetCenterProcedureSettings,
  useUpdateContractTemplate,
  useDeleteContractTemplate,
} from "@/hooks";

export default function EditContractTemplate() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const { data: procedureSettings, isLoading: isLoadingTemplate } =
    useGetCenterProcedureSettings();
  const updateContractTemplate = useUpdateContractTemplate();
  const deleteContractTemplate = useDeleteContractTemplate();

  // 계약서 템플릿 데이터를 폼에 로드
  useEffect(() => {
    if (procedureSettings?.contract_templates) {
      const contractTemplate = procedureSettings.contract_templates.find(
        (template) => template.id === templateId
      );

      if (contractTemplate) {
        setTitle(contractTemplate.title);
        setDescription(contractTemplate.description || "");
        setContent(contractTemplate.content);
      }
    }
  }, [procedureSettings, templateId]);

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
      await updateContractTemplate.mutateAsync({
        templateId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
        },
      });

      setToast({
        show: true,
        message: "계약서 템플릿이 성공적으로 수정되었습니다.",
        type: "success",
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("수정 실패:", error);
      setToast({
        show: true,
        message: "수정에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 계약서 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteContractTemplate.mutateAsync(templateId);

      setToast({
        show: true,
        message: "계약서 템플릿이 성공적으로 삭제되었습니다.",
        type: "success",
      });

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("삭제 실패:", error);
      setToast({
        show: true,
        message: "삭제에 실패했습니다. 다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
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
            <h4>계약서 수정</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-4 min-h-[100px]">
        {isLoadingTemplate ? (
          <div className="w-full flex flex-col gap-4">
            <Input
              variant="primary"
              label="계약서 제목"
              placeholder="계약서 템플릿을 불러오는 중..."
              value=""
              disabled={true}
              className="text-gr"
            />
            <Input
              variant="primary"
              label="계약서 부가설명"
              placeholder="계약서 템플릿을 불러오는 중..."
              value=""
              disabled={true}
              className="text-gr"
            />
            <div className="w-full flex flex-col gap-1">
              <h5 className="text-dg">내용</h5>
              <textarea
                placeholder="계약서 템플릿을 불러오는 중..."
                value=""
                disabled={true}
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <>
            <Input
              variant="primary"
              label="계약서 제목"
              placeholder="제목을 입력해주세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={true}
            />
            <Input
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
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
              />
            </div>
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-2 px-5 flex gap-3">
        <BigButton
          className="flex-1"
          onClick={handleDelete}
          disabled={isDeleting || isLoadingTemplate}
          variant="variant3"
        >
          {isDeleting ? "삭제 중..." : "삭제하기"}
        </BigButton>
        <BigButton
          className="flex-1"
          onClick={handleSave}
          variant="primary"
          disabled={
            !title.trim() || !content.trim() || isLoading || isLoadingTemplate
          }
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
