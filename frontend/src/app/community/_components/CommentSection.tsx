"use client";

import React, { useState } from "react";
import { CommentInput } from "./CommentInput";
import { CommentItem } from "./CommentItem";
import type { Comment } from "@/types/posts";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useCreateComment,
  useCreateReply,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { CustomModal } from "@/components/ui/CustomModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Toast } from "@/components/ui/Toast";

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
  isLoading?: boolean;
  pagination?: {
    count: number;
    totalCnt: number;
    pageCnt: number;
    curPage: number;
    nextPage: number;
    previousPage: number;
  };
  isAuthenticated: boolean;
  onLoginRequired?: () => void;
}

export function CommentSection({
  comments,
  postId,
  isLoading = false,
}: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [replyInputStates, setReplyInputStates] = useState<
    Record<string, boolean>
  >({});

  // 모든 사용자 정보를 수집 (댓글과 대댓글에서)
  const allUsers = React.useMemo(() => {
    const userMap = new Map();

    comments.forEach((comment) => {
      if (comment.user) {
        userMap.set(comment.user_id, comment.user);
      }

      comment.replies?.forEach((reply) => {
        if (reply.user) {
          userMap.set(reply.user_id, reply.user);
        }
      });
    });

    return userMap;
  }, [comments]);

  // 대댓글에 사용자 정보가 없는 경우 보완
  const enhancedComments = React.useMemo(() => {
    return comments.map((comment) => ({
      ...comment,
      replies:
        comment.replies?.map((reply) => ({
          ...reply,
          user: reply.user ||
            allUsers.get(reply.user_id) || {
              id: reply.user_id,
              nickname: `사용자${reply.user_id?.slice(-4) || ""}`,
              image: "",
            },
        })) || [],
    }));
  }, [comments, allUsers]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetIsReply, setDeleteTargetIsReply] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
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
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  // 대댓글 삭제 훅 (간단 내장)
  const queryClient = useQueryClient();
  const deleteReplyMutation = useMutation({
    mutationFn: async ({ replyId }: { replyId: string }) => {
      const response = await instance.delete<{ message: string }>(
        `/comments/replies/${replyId}`
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

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

  const handleEditComment = (commentId: string) => {
    // 수정할 댓글 찾기
    let contentToEdit = "";

    // 메인 댓글에서 찾기
    const mainComment = enhancedComments.find((c) => c.id === commentId);
    if (mainComment) {
      contentToEdit = mainComment.content;
    } else {
      // 대댓글에서 찾기
      for (const comment of enhancedComments) {
        const reply = comment.replies?.find((r) => r.id === commentId);
        if (reply) {
          contentToEdit = reply.content;
          break;
        }
      }
    }

    if (contentToEdit) {
      setEditingCommentId(commentId);
      setEditingContent(contentToEdit);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!content.trim()) {
      showToast("댓글 내용을 입력해주세요.", "error");
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: content.trim(),
      });
      showToast("댓글이 수정되었습니다.", "success");
      setEditingCommentId(null);
      setEditingContent("");
    } catch (error) {
      console.error("댓글 수정 실패:", error);
      showToast("댓글 수정에 실패했습니다.", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleEditingContentChange = (content: string) => {
    setEditingContent(content);
  };

  const handleDeleteComment = (commentId: string, isReply = false) => {
    setDeleteTargetId(commentId);
    setDeleteTargetIsReply(isReply);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteTargetId) return;

    try {
      if (deleteTargetIsReply) {
        await deleteReplyMutation.mutateAsync({ replyId: deleteTargetId });
      } else {
        await deleteCommentMutation.mutateAsync({
          postId,
          commentId: deleteTargetId,
        });
      }
      showToast("댓글이 삭제되었습니다.", "success");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeleteTargetIsReply(false);
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      showToast("댓글 삭제에 실패했습니다.", "error");
    }
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
      <div className="flex flex-col gap-2 items-start px-4 py-4 w-full overflow-x-hidden">
        <h4 className="text-bk">
          댓글{" "}
          {(() => {
            // 메인 댓글 수
            const mainCommentCount = comments.length;
            // 대댓글 수 계산 (replies가 존재하는 경우만)
            const replyCount = comments.reduce((total, comment) => {
              const repliesLength = comment.replies?.length || 0;
              return total + repliesLength;
            }, 0);
            // 총 댓글 수 = 메인 댓글 + 모든 대댓글
            const totalCount = mainCommentCount + replyCount;

            return totalCount;
          })()}
        </h4>

        {/* 상단 댓글 입력 필드 */}
        <CommentInput
          placeholder="댓글을 남겨보세요"
          onSubmit={handleComment}
          variant="primary"
          className="mb-4 w-full"
          disabled={createCommentMutation.isPending}
        />

        {/* 댓글 목록 */}
        <div className="flex flex-col gap-4 w-full">
          {enhancedComments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-3 w-full">
              {/* 메인 댓글 */}
              <CommentItem
                comment={comment}
                variant="primary"
                onToggleReplies={() => toggleReplies(comment.id)}
                onAddReply={() => showReplyInput(comment.id)}
                onLoginRequired={() => setIsLoginModalOpen(true)}
                onEdit={handleEditComment}
                onDelete={(id) => handleDeleteComment(id, false)}
                isEditing={editingCommentId === comment.id}
                editingContent={editingContent}
                onEditingContentChange={handleEditingContentChange}
                onSaveEdit={() =>
                  handleUpdateComment(comment.id, editingContent)
                }
                onCancelEdit={handleCancelEdit}
              />

              {/* 답글들 */}
              {comment.replies &&
                comment.replies.length > 0 &&
                showReplies[comment.id] && (
                  <div className="ml-11 space-y-3 pr-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <CommentItem
                          comment={reply}
                          variant="reply"
                          onLoginRequired={() => setIsLoginModalOpen(true)}
                          onEdit={handleEditComment}
                          onDelete={(id) => handleDeleteComment(id, true)}
                          isEditing={editingCommentId === reply.id}
                          editingContent={editingContent}
                          onEditingContentChange={handleEditingContentChange}
                          onSaveEdit={() =>
                            handleUpdateComment(reply.id, editingContent)
                          }
                          onCancelEdit={handleCancelEdit}
                        />
                      </div>
                    ))}
                  </div>
                )}

              {/* 메인 댓글에 대한 답글 입력 필드 */}
              {replyInputStates[comment.id] && (
                <div className="ml-8 mt-2 pr-4">
                  <CommentInput
                    placeholder="답글을 남겨보세요"
                    onSubmit={(text) => {
                      handleReply(text, comment.id);
                      setReplyInputStates((prev) => ({
                        ...prev,
                        [comment.id]: false,
                      }));
                    }}
                    variant="primary"
                    disabled={createReplyMutation.isPending}
                    className="w-full"
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
        onCtaClick={() => {
          const next = `${window.location.pathname}${window.location.search}`;
          document.cookie = `redirect_after_login=${encodeURIComponent(
            next
          )}; path=/; max-age=600`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
        }}
      />

      {/* 삭제 확인 모달 */}
      <BottomSheet
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        variant="primary"
        title="정말 삭제하시겠습니까?"
        description="삭제된 댓글은 되돌릴 수 없어요."
        leftButtonText="아니요"
        rightButtonText="네, 삭제할래요"
        onLeftClick={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onRightClick={confirmDeleteComment}
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
