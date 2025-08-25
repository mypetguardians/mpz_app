"use client";

import { ChevronLeft, Trash2 } from "lucide-react";
import { TopBar } from "@/components/common/TopBar";
import { IconButton } from "@/components/ui/IconButton";
import { MiniButton } from "@/components/ui/MiniButton";
import { Container } from "@/components/common/Container";
import { useGetCenterAdmins } from "@/hooks/query/useGetCenterAdmins";

export default function AdminPage() {
  const { data: centerAdminsData, isLoading, error } = useGetCenterAdmins();

  const handleBack = () => {
    // 뒤로가기 로직
    window.history.back();
  };

  const handleCreateId = () => {
    // 아이디 만들기 로직
    console.log("아이디 만들기 클릭");
  };

  const handleDelete = (id: string) => {
    // 삭제 로직
    console.log(`삭제: ${id}`);
  };

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <Container className="min-h-screen">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ChevronLeft}
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
                icon={ChevronLeft}
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

  const centerAdmins = centerAdminsData?.admins || [];

  return (
    <Container className="min-h-screen">
      <TopBar
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={ChevronLeft}
              onClick={handleBack}
              label="뒤로가기"
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
                    {admin.name}
                  </h3>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(admin.createdAt).toLocaleDateString("ko-KR")} 등록
                  </p>
                </div>
                <IconButton
                  icon={Trash2}
                  size="iconS"
                  onClick={() => handleDelete(admin.id)}
                  label="삭제"
                  className="mt-1"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </Container>
  );
}
