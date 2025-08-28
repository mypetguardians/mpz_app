"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/common/TopBar";
import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { IconButton } from "@/components/ui/IconButton";
import { useCreateCenterAdmin } from "@/hooks/mutation/useCreateCenterAdmin";

export default function CreateCenterAdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone_number, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCenterAdmin = useCreateCenterAdmin();

  const handleSave = async () => {
    if (!username.trim() || !password.trim() || !nickname.trim()) {
      alert("필수 필드를 입력해주세요.");
      return;
    }

    if (username.length < 3 || username.length > 30) {
      alert("아이디는 3-30자 사이여야 합니다.");
      return;
    }

    if (password.length < 8) {
      alert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (nickname.length < 1 || nickname.length > 50) {
      alert("닉네임은 1-50자 사이여야 합니다.");
      return;
    }

    if (phone_number.length > 20) {
      alert("전화번호는 20자 이하여야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        username: username.trim(),
        password: password,
        email: email.trim() || "",
        nickname: nickname.trim(),
        user_type: "센터관리자,센터최고관리자",
        phone_number: phone_number.trim() || "",
      };

      console.log("전송할 데이터:", payload);

      await createCenterAdmin.mutateAsync(payload);

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
              <h4>센터관리자 생성</h4>
            </div>
          }
        />

        <div className="mx-4 mt-2.5">
          <div className="flex flex-col gap-4">
            {/* 닉네임 섹션 */}

            {/* 아이디 섹션 */}
            <CustomInput
              label="아이디"
              placeholder="아이디를 입력해주세요. (3-30자)"
              value={username}
              required={true}
              onChange={(e) => setUsername(e.target.value)}
            />

            {/* 비밀번호 섹션 */}
            <CustomInput
              label="비밀번호"
              placeholder="비밀번호를 입력해주세요. (최소 8자)"
              value={password}
              required={true}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />

            {/* 이메일 섹션 */}
            <CustomInput
              label="이메일"
              placeholder="이메일을 입력해주세요."
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            <CustomInput
              label="닉네임"
              placeholder="닉네임을 입력해주세요. (1-50자)"
              value={nickname}
              required={false}
              onChange={(e) => setNickname(e.target.value)}
            />

            {/* 전화번호 섹션 */}
            <CustomInput
              label="전화번호"
              placeholder="전화번호를 입력해주세요. (최대 20자)"
              value={phone_number}
              required={false}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
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
            {isSubmitting ? "생성 중..." : "센터관리자 생성"}
          </BigButton>
        </div>
      </div>
    </>
  );
}
