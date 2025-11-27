"use client";

import { ArrowLeft, Trash } from "@phosphor-icons/react";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { Container } from "@/components/common/Container";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useGetCenterAdmins } from "@/hooks/query/useGetCenterAdmins";
import { useDeleteCenterAdmin } from "@/hooks/mutation/useDeleteCenterAdmin";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminPage() {
  const { data: centerAdminsData, isLoading, error } = useGetCenterAdmins();
  const deleteCenterAdminMutation = useDeleteCenterAdmin();
  const router = useRouter();

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleBack = () => {
    window.history.back();
  };

  const handleCreateId = () => {
    router.push("/centerpage/admin/create");
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      await deleteCenterAdminMutation.mutateAsync(deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setToast({
        show: true,
        message: "관리자가 성공적으로 삭제되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("관리자 삭제 실패:", error);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setToast({
        show: true,
        message: "관리자 삭제에 실패했습니다.",
        type: "error",
      });
    }
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                onClick={handleBack}
                label="뒤로가기"
              />
              <h4>관리자 초대 및 관리</h4>
            </div>
          }
        />
        <div className="mx-4 mt-2.5">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                onClick={handleBack}
                label="뒤로가기"
              />
              <h4>관리자 초대 및 관리</h4>
            </div>
          }
        />
        <div className="mx-4 mt-2.5">
          <div className="text-center py-8 text-red-500">
            관리자 목록을 불러오는데 실패했습니다
          </div>
        </div>
      </Container>
    );
  }

  const centerAdmins = centerAdminsData || [];

  return (
    <Container className="min-h-screen">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={ArrowLeft}
              onClick={() => router.push("/centerpage")}
            />
            <h4>관리자 초대 및 관리</h4>
          </div>
        }
      />

      <div className="mx-4 mt-2.5">
        {/* 아이디 만들기 버튼 */}
        <MiniButton
          text="아이디 만들기"
          variant="filterOff"
          onClick={handleCreateId}
        />

        {/* 관리 항목들 */}
        <div className="flex flex-col gap-4 mt-4">
          {centerAdmins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 관리자가 없습니다
            </div>
          ) : (
            centerAdmins.map((admin) => (
              <div key={admin.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {admin.username}
                  </h3>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(admin.created_at).toLocaleDateString("ko-KR")}{" "}
                    등록
                  </p>
                </div>
                <IconButton
                  icon={Trash}
                  size="iconS"
                  onClick={() => handleDeleteClick(admin.id)}
                  label="삭제"
                  className="mt-1"
                  disabled={deleteCenterAdminMutation.isPending}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 삭제 확인 바텀시트 */}
      <BottomSheet
        open={showDeleteModal}
        onClose={handleDeleteCancel}
        variant="primary"
        title="정말로 이 관리자를 삭제하시겠습니까?"
        description="삭제된 관리자는 되돌릴 수 없어요."
        leftButtonText="아니요"
        rightButtonText="네, 삭제할래요"
        onLeftClick={handleDeleteCancel}
        onRightClick={handleDeleteConfirm}
      />

      {/* Toast 컴포넌트 */}
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
