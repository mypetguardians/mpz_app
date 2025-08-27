"use client";

import { useState } from "react";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import type { CommentWithRepliesSchema } from "@/server/openapi/routes/posts";
import { z } from "zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCreateComment, useCreateReply } from "@/hooks/mutation";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";

type Comment = z.infer<typeof CommentWithRepliesSchema>;

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
  isLoading?: boolean;
  users?: Array<{
    id: string;
    nickname: string;
    profileImg: string;
  }>;
  isAuthenticated: boolean;
  onLoginRequired?: () => void;
}

export function CommentSection({
  comments,
  postId,
  isLoading = false,
  users,
}: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyInputStates, setReplyInputStates] = useState<
    Record<string, boolean>
  >({});

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const createCommentMutation = useCreateComment();
  const createReplyMutation = useCreateReply();

  // 사용자 정보 null 대체
  const defaultUsers =
    users ||
    comments.map((comment) => ({
      id: comment.userId,
      nickname: comment.user?.nickname || "사용자",
      profileImg: comment.user?.image || "/img/dummyImg.jpeg",
    }));

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const handleComment = async (text: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: text,
      });
      showToast("댓글이 작성되었습니다.", "success");
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      showToast("댓글 작성에 실패했습니다.", "error");
    }
  };

  const handleReply = async (text: string, commentId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      await createReplyMutation.mutateAsync({
        commentId,
        content: text,
      });
      showToast("답글이 작성되었습니다.", "success");
    } catch (error) {
      console.error("대댓글 작성 실패:", error);
      showToast("답글 작성에 실패했습니다.", "error");
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const showReplyInput = (commentId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    // 답글 입력 상태를 true로 설정 (메인 댓글에만)
    setReplyInputStates((prev) => ({
      ...prev,
      [commentId]: true,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 items-start px-4 py-4">
        <h4 className="text-bk">댓글</h4>
        <div className="flex items-center justify-center w-full py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 댓글 헤더와 상단 입력 필드 */}
      <div className="flex flex-col gap-2 items-start px-4 py-4 ">
        <h4 className="text-bk">댓글 {comments.length}</h4>

        {/* 상단 댓글 입력 필드 */}
        <CommentInput
          placeholder="댓글을 남겨보세요"
          onSubmit={handleComment}
          variant="primary"
          className="mb-4 w-full"
          disabled={createCommentMutation.isPending}
        />

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* 메인 댓글 */}
              <CommentItem
                comment={comment}
                variant="primary"
                onToggleReplies={() => toggleReplies(comment.id)}
                onAddReply={() => showReplyInput(comment.id)}
                users={defaultUsers}
                onLoginRequired={() => setIsLoginModalOpen(true)}
              />

              {/* 답글들 */}
              {comment.replies &&
                comment.replies.length > 0 &&
                showReplies[comment.id] && (
                  <div className="ml-11 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <CommentItem
                          comment={reply}
                          variant="reply"
                          onLoginRequired={() => setIsLoginModalOpen(true)}
                        />
                      </div>
                    ))}
                  </div>
                )}

              {/* 메인 댓글에 대한 답글 입력 필드 */}
              {replyInputStates[comment.id] && (
                <div className="ml-8 mt-2">
                  <CommentInput
                    placeholder="답글을 남겨보세요"
                    onSubmit={(text) => handleReply(text, comment.id)}
                    variant="primary"
                    disabled={createReplyMutation.isPending}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 로그인 모달 */}
      <CustomModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="로그인 후 이용해주세요"
        variant="variant2"
        ctaText="로그인하기"
        onCtaClick={() => (window.location.href = "/login")}
      />

      {/* 알림 토스트 */}
      {toast.show && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toast.message}</Toast>
        </div>
      )}
    </>
  );
}
