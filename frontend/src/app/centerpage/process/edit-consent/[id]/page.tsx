"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter, useParams } from "next/navigation";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { InfoCard } from "@/components/ui/InfoCard";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { useGetConsent, useUpdateConsent, useDeleteConsent } from "@/hooks";

export default function EditConsent() {
  const router = useRouter();
  const params = useParams();
  const consentId = params.id as string;

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

  const { data: consentData, isLoading: isLoadingConsent } =
    useGetConsent(consentId);
  const updateConsent = useUpdateConsent();
  const deleteConsent = useDeleteConsent();

  // 동의서 데이터를 폼에 로드
  useEffect(() => {
    if (consentData) {
      setTitle(consentData.title);
      setDescription(consentData.description || "");
      setContent(consentData.content);
    }
  }, [consentData]);

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
      await updateConsent.mutateAsync({
        consentId,
        data: {
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          is_active: true,
        },
      });

      setToast({
        show: true,
        message: "동의서가 성공적으로 수정되었습니다.",
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
    if (!confirm("정말로 이 동의서를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteConsent.mutateAsync(consentId);

      setToast({
        show: true,
        message: "동의서가 성공적으로 삭제되었습니다.",
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
            <h4>동의서 수정</h4>
          </div>
        }
      />
      <div className="w-full flex flex-col px-4 gap-4 min-h-[100px]">
        {isLoadingConsent ? (
          <div className="w-full flex flex-col gap-4">
            <InfoCard>
              예비 입양자가 필수로 유의할 사항을 입력하면 돼요. 입양자에겐
              동의/비동의 형태로 보여질 거예요.
            </InfoCard>
            <CustomInput
              variant="primary"
              label="동의서 제목"
              placeholder="동의서를 불러오는 중..."
              value=""
              disabled={true}
              className="text-gr"
            />
            <CustomInput
              variant="primary"
              label="동의서 부가설명"
              placeholder="동의서를 불러오는 중..."
              value=""
              disabled={true}
              className="text-gr"
            />
            <div className="w-full flex flex-col gap-1">
              <h5 className="text-dg">내용</h5>
              <textarea
                placeholder="동의서를 불러오는 중..."
                value=""
                disabled={true}
                className="flex w-full rounded-md border border-input bg-background px-4 py-3 h5 ring-offset-background placeholder:text-gr placeholder:text-body placeholder:text-top disabled:cursor-not-allowed disabled:opacity-50 resize-none h-[150px] focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <>
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
          disabled={isDeleting || isLoadingConsent}
          variant="variant3"
        >
          {isDeleting ? "삭제 중..." : "삭제하기"}
        </BigButton>
        <BigButton
          className="flex-1"
          onClick={handleSave}
          variant="primary"
          disabled={
            !title.trim() || !content.trim() || isLoading || isLoadingConsent
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
