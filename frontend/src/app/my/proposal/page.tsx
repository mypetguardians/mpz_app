"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { IconButton } from "@/components/ui/IconButton";
import { BigButton } from "@/components/ui/BigButton";
import { useCreateFeedback } from "@/hooks/mutation/useCreateFeedback";
import { useAuth } from "@/components/providers/AuthProvider";

type FeedbackType = "버그신고" | "기능요청" | "불편사항" | "문의사항" | "기타";

export default function ProposalPage() {
  const [content, setContent] = useState("");
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("기타");
  const { user } = useAuth();

  const {
    mutate: createFeedback,
    isPending,
    ToastComponent,
  } = useCreateFeedback();

  const resetForm = () => {
    setContent("");
    setFeedbackType("기타");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert("내용을 입력해주세요");
      return;
    }

    const feedbackData = {
      type: feedbackType,
      content: content.trim(),
      email: user?.email,
      userAgent: navigator.userAgent,
      deviceInfo: `${navigator.platform} - ${navigator.language}`,
      pageUrl: window.location.href,
    };

    createFeedback(feedbackData, {
      onSuccess: () => {
        resetForm();
      },
    });
  };

  const handleBack = () => {
    if (content.trim()) {
      if (confirm("작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  return (
    <Container className="min-h-screen">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <IconButton icon={ArrowLeft} size="iconM" onClick={handleBack} />
            <h4 className="font-semibold text-black">고객센터</h4>
          </div>
        }
      />

      <div className="mx-4 pb-32">
        <div className="flex flex-col gap-6">
          {/* 메인 제목 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-black">
              건의사항 및 피드백
            </h2>
            <p className="body2 text-gr">
              마이펫가디언즈를 이용하며 느낀 서비스 이용 후기, 불편한 점,
              건의사항 등 어떤 의견이든 좋아요. <br />
              자유롭게 작성해주세요!
            </p>
          </div>

          {/* 피드백 타입 선택 */}
          <div className="mb-4">
            <h5 className="text-dg mb-2">피드백 유형</h5>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "기타", label: "기타" },
                { value: "버그신고", label: "버그신고" },
                { value: "기능요청", label: "기능요청" },
                { value: "불편사항", label: "불편사항" },
                { value: "문의사항", label: "문의사항" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFeedbackType(type.value as FeedbackType)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    feedbackType === type.value
                      ? "bg-brand text-white border-brand"
                      : "bg-white text-dg border-input"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h5 className="text-dg mb-2">마펫쯔에게 한마디</h5>
            <textarea
              placeholder="자유롭게 작성해주세요"
              value={content}
              onChange={handleContentChange}
              className="w-full h-32 p-4 border border-input rounded-md resize-none text-body placeholder:text-gr focus:outline-none focus:border-brand"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="mt-4">
            <BigButton
              onClick={handleSubmit}
              disabled={!content.trim() || isPending}
              className="w-full"
            >
              {isPending ? "제출 중..." : "피드백 제출하기"}
            </BigButton>
          </div>
        </div>
      </div>

      <ToastComponent />
    </Container>
  );
}
