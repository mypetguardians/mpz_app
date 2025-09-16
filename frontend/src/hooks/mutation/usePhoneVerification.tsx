"use client";

import { useMutation } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface SendVerificationRequest {
  phone_number: string;
}

interface SendVerificationResponse {
  success: boolean;
  message: string;
  is_verified: boolean;
}

interface VerifyCodeRequest {
  phone_number: string;
  verification_code: string;
}

interface VerifyCodeResponse {
  success: boolean;
  message: string;
  is_verified: boolean;
}

// 전화번호 인증코드 발송
export const useSendPhoneVerification = () => {
  return useMutation<SendVerificationResponse, Error, SendVerificationRequest>({
    mutationFn: async (data) => {
      const response = await instance.post(
        "/adoptions/phone/send-verification",
        data
      );
      return response.data;
    },
  });
};

// 전화번호 인증코드 확인
export const useVerifyPhoneCode = () => {
  return useMutation<VerifyCodeResponse, Error, VerifyCodeRequest>({
    mutationFn: async (data) => {
      const response = await instance.post("/adoptions/phone/verify", data);
      return response.data;
    },
  });
};
