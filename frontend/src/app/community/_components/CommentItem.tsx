"use client";

import { useState } from "react";
import Image from "next/image";

import { Avatar } from "@/components/ui/avatar";
import {
  ArrowBendDownLeft,
  ArrowBendDownRight,
  User,
  DotsThree,
} from "@phosphor-icons/react";
import { CommentInput } from "./CommentInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Comment, Reply } from "@/types/posts";

interface CommentItemProps {
  comment: Comment | Reply;
  variant: "primary" | "reply" | "replyInput";
  onToggleReplies?: () => void;
  onAddReply?: () => void;
  onSubmitReply?: (text: string) => void;
  showReplies?: boolean;
  onLoginRequired?: () => void;
  onEdit?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  isEditing?: boolean;
  editingContent?: string;
  onEditingContentChange?: (content: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

export function CommentItem({
  comment,
  variant,
  onToggleReplies,
  onAddReply,
  onSubmitReply,
  onEdit,
  onDelete,
  isEditing = false,
  editingContent = "",
  onEditingContentChange,
  onSaveEdit,
  onCancelEdit,
}: CommentItemProps) {
  const { user } = useAuth();
  const [showActionSheet, setShowActionSheet] = useState(false);

  // 사용자 정보 가져오기 (대댓글에서 user 정보가 없을 경우 대비)
  const rawNickname =
    comment.user?.nickname || `사용자${comment.user_id?.slice(-4) || ""}`;
  const userType = comment.user?.user_type;
  const centerName = comment.user?.center_name;

  // 센터 계정인 경우: "센터이름 - 닉네임" 형태로 표시
  const nickname =
    userType &&
    ["센터관리자", "센터최고관리자", "훈련사"].includes(userType) &&
    centerName
      ? `${centerName} - ${rawNickname}`
      : rawNickname;
  const profileImg = comment.user?.image;

  // 현재 사용자가 댓글 작성자인지 확인
  const isMyComment =
    user?.id && comment.user_id && user.id === comment.user_id;

  const handleEdit = () => {
    setShowActionSheet(false);
    onEdit?.(comment.id);
  };

  const handleDelete = () => {
    setShowActionSheet(false);
    onDelete?.(comment.id);
  };

  const renderContent = () => {
    switch (variant) {
      case "primary":
        return (
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              {profileImg && profileImg !== "" ? (
                <Image
                  src={profileImg}
                  alt={nickname}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error("ProfileInfo Image load error:", e);
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full bg-lg flex items-center justify-center p-1 rounded-full`}
                >
                  <User size={20} weight="regular" className="text-gr" />
                </div>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-1 pr-8">
                <span className="font-semibold text-sm text-gray-600 truncate">
                  {nickname}
                </span>
              </div>
              {isMyComment && !isEditing && (
                <div className="absolute top-0 right-0">
                  <IconButton
                    icon={({ size }) => <DotsThree size={size} weight="bold" />}
                    size="iconS"
                    onClick={() => setShowActionSheet(true)}
                    className="text-gray-500"
                  />
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2">
                  <CommentInput
                    placeholder="댓글을 입력하세요"
                    value={editingContent}
                    onChange={(e) => onEditingContentChange?.(e.target.value)}
                    variant="primary"
                    maxLength={500}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={onCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      취소
                    </button>
                    <button
                      onClick={onSaveEdit}
                      disabled={!editingContent?.trim()}
                      className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-black mb-2">{comment.content}</p>
                  <div className="flex gap-3">
                    {"replies" in comment &&
                      comment.replies &&
                      comment.replies.length > 0 && (
                        <button
                          className="text-xs text-gray-500 cursor-pointer"
                          onClick={onToggleReplies}
                        >
                          답글 {comment.replies.length}개
                        </button>
                      )}
                    <button
                      className="text-xs text-gray-500 cursor-pointer"
                      onClick={onAddReply}
                    >
                      답글 달기
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "reply":
        return (
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <ArrowBendDownRight size={16} className="text-gray-400" />
              <Avatar className="w-6 h-6">
                {profileImg && profileImg !== "" ? (
                  <Image
                    src={profileImg}
                    alt={nickname}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error("ProfileInfo Image load error:", e);
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-lg flex items-center justify-center p-1 rounded-full`}
                  >
                    <User size={16} weight="regular" className="text-gr" />
                  </div>
                )}
              </Avatar>
            </div>
            <div className="flex-1 min-w-0 relative">
              <div className="flex items-center gap-2 mb-1 pr-8">
                <span className="font-semibold text-xs text-gray-600 truncate">
                  {nickname}
                </span>
              </div>
              {isMyComment && !isEditing && (
                <div className="absolute top-0 right-0">
                  <IconButton
                    icon={({ size }) => <DotsThree size={size} weight="bold" />}
                    size="iconS"
                    onClick={() => setShowActionSheet(true)}
                    className="text-gray-500"
                  />
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2">
                  <CommentInput
                    placeholder="답글을 입력하세요"
                    value={editingContent}
                    onChange={(e) => onEditingContentChange?.(e.target.value)}
                    variant="primary"
                    maxLength={500}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={onCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      취소
                    </button>
                    <button
                      onClick={onSaveEdit}
                      disabled={!editingContent?.trim()}
                      className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-black mb-1">{comment.content}</p>
              )}
            </div>
          </div>
        );

      case "replyInput":
        return (
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <ArrowBendDownLeft size={16} className="text-lg" />
              <Avatar className="w-6 h-6">
                {profileImg && profileImg !== "" ? (
                  <Image
                    src={profileImg}
                    alt={nickname}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      console.error("ProfileInfo Image load error:", e);
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-lg flex items-center justify-center p-1 rounded-full`}
                  >
                    <User size={16} weight="regular" className="text-gr" />
                  </div>
                )}
              </Avatar>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-600">
                  {nickname}
                </span>
              </div>
              <p className="text-xs text-black mb-2">{comment.content}</p>
              <CommentInput
                placeholder="댓글을 남겨보세요"
                onSubmit={onSubmitReply}
                variant="primary"
                className="mb-4 w-full"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-3">{renderContent()}</div>

      {/* 수정/삭제 바텀시트 */}
      <BottomSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        variant="primary"
        title="댓글 작업을 선택하세요."
        leftButtonText="댓글 수정"
        rightButtonText="댓글 삭제"
        onLeftClick={handleEdit}
        onRightClick={handleDelete}
      />
    </>
  );
}
