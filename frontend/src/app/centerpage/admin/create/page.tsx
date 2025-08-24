"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";
import { Input } from "@/components/ui/CustomInput";
import { IconButton } from "@/components/ui/IconButton";
import { useCreateCenterAdmin } from "@/hooks/mutation/useCreateCenterAdmin";

export default function CreateCenterAdminPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCenterAdmin = useCreateCenterAdmin();

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCenterAdmin.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      alert("센터 관리자가 성공적으로 생성되었습니다.");
      router.push("/centerpage/admin");
    } catch (error) {
      console.error("센터 관리자 생성 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "센터 관리자 생성에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push("/centerpage/admin");
  };

  return (
    <>
      <Container className="min-h-screen ">
        <TopBar
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={ArrowLeft}
                size="iconM"
                onClick={handleBack}
                label="뒤로가기"
              />
              <h4>아이디 만들기</h4>
            </div>
          }
        />

        <div className="mx-4 mt-2.5">
          <div className="flex flex-col gap-4">
            {/* 이름섹션 */}
            <Input
              label="이름"
              placeholder="이름을 입력해주세요."
              value={name}
              required={true}
              onChange={(e) => setName(e.target.value)}
            />

            {/* 이메일 섹션 */}
            <Input
              label="이메일"
              placeholder="이메일을 입력해주세요."
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            {/* 비밀번호 섹션 */}
            <Input
              label="비밀번호"
              placeholder="비밀번호를 입력해주세요. (최소 6자)"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>
        </div>
      </Container>

      {/* 저장 버튼 */}
      <div className="fixed bottom-10 left-0 right-0 z-50 px-4">
        <div className="max-w-[380px] mx-auto">
          <BigButton
            className="w-full"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "생성 중..." : "저장하기"}
          </BigButton>
        </div>
      </div>
    </>
  );
}
