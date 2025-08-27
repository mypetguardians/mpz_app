"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeSlash } from "@phosphor-icons/react";
import Image from "next/image";

import { Container } from "@/components/common/Container";
import { BigButton } from "@/components/ui/BigButton";
import { CustomInput } from "@/components/ui/CustomInput";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";

interface LoginFormData {
  email: string;
  password: string;
}

export default function CenterLogIn() {
  const router = useRouter();
  const { setUserFromToken, setLoggingIn } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요";
    }

    if (!formData.password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoggingIn(true); // 로그인 시작 상태 설정
    setErrors({});
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 센터 관리자만 로그인 가능
        if (data.user.userType === "센터관리자") {
          setToastMessage("로그인에 성공했습니다!");
          setShowToast(true);

          // 서버에서 토큰으로 사용자 정보를 다시 가져온 후 홈으로 이동
          try {
            await setUserFromToken();
            setTimeout(() => {
              router.push("/");
            }, 1000);
          } catch (error) {
            setToastMessage("사용자 정보를 가져오는데 실패했습니다.");
            setLoggingIn(false);
            console.error("Login error:", error);
          }
        } else {
          setToastMessage("센터 계정으로만 로그인할 수 있습니다.");
          setShowToast(true);
          setLoggingIn(false);
          setTimeout(() => setShowToast(false), 3000);
        }
      } else {
        setToastMessage(data.error || "로그인에 실패했습니다.");
        setShowToast(true);
        setLoggingIn(false); // 로그인 실패 시 상태 리셋
        // 3초 후 자동으로 토스트 숨김
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setToastMessage("로그인 중 오류가 발생했습니다.");
      setShowToast(true);
      setLoggingIn(false); // 로그인 오류 시 상태 리셋
      // 3초 후 자동으로 토스트 숨김
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-h-screen flex flex-col justify-between px-4">
      <div className="flex flex-col gap-1 items-center mt-[90px]">
        <Link href="/">
          <Image
            src="/illust/logo.svg"
            alt="로고 일러스트"
            width={250}
            height={216}
            className="w-full h-full"
            priority
          />
        </Link>
        <h4 className="text-dg">마펫쯔 한 줄 라이팅</h4>
      </div>

      <div className="flex flex-col gap-7">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full mx-auto"
        >
          {/* 이메일 입력 */}
          <CustomInput
            label="이메일"
            placeholder="이메일을 입력하세요"
            variant="primary"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={!!errors.email}
            required
          />
          {errors.email && (
            <p className="text-error text-sm -mt-2">{errors.email}</p>
          )}

          {/* 비밀번호 입력 */}
          <div className="relative">
            <CustomInput
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              variant="primary"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={!!errors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-[calc(50%+15px)] right-4 transform -translate-y-1/2 flex items-center justify-center text-gr cursor-pointer hover:text-gr"
            >
              {showPassword ? <Eye size={20} /> : <EyeSlash size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-error text-sm -mt-2">{errors.password}</p>
          )}
        </form>

        <div className="flex flex-col gap-4 pb-6">
          <BigButton
            variant="variant4"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "로그인 중..." : "센터계정으로 시작하기"}
          </BigButton>

          <div className="text-center">
            <Link
              href="/login"
              className="text-gr text-sm hover:text-brand transition-colors"
            >
              일반 사용자 카카오 로그인하기
            </Link>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          onClick={() => setShowToast(false)}
          className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-[9999]"
        >
          {toastMessage}
        </Toast>
      )}
    </Container>
  );
}
