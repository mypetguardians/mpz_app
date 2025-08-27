"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { Input } from "@/components/ui/CustomInput";
import { BigButton } from "@/components/ui/BigButton";
import { IconButton } from "@/components/ui/IconButton";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { useGetPostDetail } from "@/hooks/query/useGetPosts";
import { useUpdatePost } from "@/hooks/mutation/useUpdatePost";
import { useDeletePost } from "@/hooks/mutation/useDeletePost";
import { useAuth } from "@/components/providers/AuthProvider";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 게시글 데이터 가져오기
  const {
    data: postDetailData,
    isLoading: isPostLoading,
    error: postError,
  } = useGetPostDetail(params.id as string);

  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  // 게시글 데이터
  const post = postDetailData?.post;

  // 현재 사용자가 게시글 작성자인지 확인
  const isMyPost = user?.id && post?.userId && user.id === post.userId;

  // 태그 추출 함수
  const extractTags = (text: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = text.match(tagRegex);
    if (!matches) return [];

    // # 제거하고 중복 제거
    return [...new Set(matches.map((tag) => tag.slice(1)))];
  };

  // 내용이 변경될 때마다 태그 추출
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setTags(extractTags(newContent));
  };

  // 게시글 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (post) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setTags(extractTags(post.content || ""));
    }
  }, [post]);

  // 권한 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (post && !isMyPost) {
      router.push("/community");
      return;
    }
  }, [isAuthenticated, post, isMyPost, router]);

  // 토스트 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setToastMessage("제목과 내용을 모두 입력해주세요.");
      setShowToast(true);
      return;
    }

    try {
      // 게시글 수정
      await updatePostMutation.mutateAsync({
        postId: params.id as string,
        data: {
          title: title.trim(),
          content: content.trim(),
          contentTags: tags.join(","), // 태그를 쉼표로 구분하여 contentTags에 저장
        },
      });

      // 태그는 updatePost에서 처리됨 (서버에서 기존 태그 삭제 후 새로 생성)

      // 수정 완료 후 상세 페이지로 이동
      router.push(`/community/${params.id}`);
    } catch (error) {
      console.error("게시글 수정 실패:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(params.id as string);
      setShowDeleteModal(false);
      setToastMessage("게시글이 삭제되었습니다.");
      setShowToast(true);

      // 삭제 완료 후 목록으로 이동
      setTimeout(() => {
        router.push("/community");
      }, 1000);
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
    }
  };

  // 로딩 상태
  if (isPostLoading) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => router.back()}
              />
              <h2>게시글 수정</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    );
  }

  // 에러 상태
  if (postError || !post) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => router.back()}
              />
              <h2>게시글 수정</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="min-h-screen bg-white">
      <TopBar
        variant="variant5"
        className="border-b border-lg"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => router.back()}
            />
          </div>
        }
        center={<h4>게시글 수정</h4>}
        right={
          <IconButton
            icon={({ size }) => <Trash size={size} weight="bold" />}
            size="iconM"
            onClick={() => setShowDeleteModal(true)}
            className="text-red-500"
          />
        }
      />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-4">
        {/* 제목 입력 */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-700">
            제목
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            required
          />
        </div>

        {/* 내용 입력 */}
        <div className="space-y-2">
          <label
            htmlFor="content"
            className="text-sm font-medium text-gray-700"
          >
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            placeholder="내용을 입력하세요. #태그를 사용해보세요"
            className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2000}
            required
          />
          <div className="text-right text-sm text-gray-500">
            {content.length}/2000
          </div>
          {/* 추출된 태그 표시 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="space-y-3 pt-4">
          <BigButton
            type="submit"
            variant="primary"
            disabled={updatePostMutation.isPending}
            className="w-full"
          >
            {updatePostMutation.isPending ? "수정 중..." : "수정 완료"}
          </BigButton>

          <BigButton
            type="button"
            variant="variant3"
            onClick={() => router.back()}
            className="w-full"
          >
            취소
          </BigButton>
        </div>
      </form>

      {/* 삭제 확인 모달 */}
      <CustomModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="게시글을 삭제하시겠습니까?"
        description="삭제된 게시글은 되돌릴 수 없습니다."
        variant="variant2"
        ctaText="삭제"
        onCtaClick={handleDelete}
      />

      {/* 토스트 */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </Container>
  );
}
