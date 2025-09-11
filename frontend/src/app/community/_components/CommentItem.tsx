"use client";

import Image from "next/image";

import { Avatar } from "@/components/ui/avatar";
import {
  ArrowBendDownLeft,
  ArrowBendDownRight,
  User,
} from "@phosphor-icons/react";
import { CommentInput } from "@/components/ui/CommentInput";
import type { Comment, Reply } from "@/types/posts";

interface CommentItemProps {
  comment: Comment | Reply;
  variant: "primary" | "reply" | "replyInput";
  onToggleReplies?: () => void;
  onAddReply?: () => void;
  onSubmitReply?: (text: string) => void;
  showReplies?: boolean;
  onLoginRequired?: () => void;
}

export function CommentItem({
  comment,
  variant,
  onToggleReplies,
  onAddReply,
  onSubmitReply,
}: CommentItemProps) {
  // 사용자 정보 가져오기 (대댓글에서 user 정보가 없을 경우 대비)
  const nickname =
    comment.user?.nickname || `사용자${comment.user_id?.slice(-4) || ""}`;
  const profileImg = comment.user?.image;

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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-600">
                  {nickname}
                </span>
              </div>
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
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-600">
                  {nickname}
                </span>
              </div>
              <p className="text-xs text-black mb-1">{comment.content}</p>
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

  return <div className="space-y-3">{renderContent()}</div>;
}
