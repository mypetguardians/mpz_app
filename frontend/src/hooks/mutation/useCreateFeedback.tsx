import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Toast } from "@/components/ui/Toast";
import instance from "@/lib/axios-instance";

interface CreateFeedbackData {
  content: string;
  email?: string;
  userAgent?: string;
  deviceInfo?: string;
  pageUrl?: string;
}

interface CreateFeedbackResponse {
  message: string;
  status: string;
}

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const mutation = useMutation({
    mutationFn: async (
      data: CreateFeedbackData
    ): Promise<CreateFeedbackResponse> => {
      const response = await instance.post<CreateFeedbackResponse>(
        "/feedback/",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      showToastMessage(data.message || "피드백이 성공적으로 제출되었습니다");
      // 피드백 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (error: Error) => {
      showToastMessage(error.message || "피드백 제출에 실패했습니다");
    },
  });

  const ToastComponent = () => (
    <>
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </>
  );

  return {
    ...mutation,
    ToastComponent,
  };
};
