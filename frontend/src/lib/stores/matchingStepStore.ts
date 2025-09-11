import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIRecommendResponse } from "@/types/ai-matching";

// 각 단계별 답변 타입 정의
type StepAnswer =
  | { type: "activity"; value: string }
  | { type: "space"; value: string }
  | { type: "age"; value: string }
  | { type: "gender"; value: string }
  | { type: "sensitivity"; value: string }
  | { type: "size"; value: string }
  | { type: "experience"; value: string }
  | { type: "time"; value: string }
  | { type: "budget"; value: string }
  | { type: "custom"; value: string };

interface MatchingStepStore {
  currentStep: number;
  completedSteps: number[];
  answers: Record<number, StepAnswer>;
  aiMatchingResult: AIRecommendResponse | null; // AI 매칭 결과 저장

  setCurrentStep: (step: number) => void;
  setStepAnswer: (step: number, answer: StepAnswer) => void;
  markStepCompleted: (step: number) => void;
  setAIMatchingResult: (result: AIRecommendResponse) => void; // AI 매칭 결과 설정
  clearAIMatchingResult: () => void; // AI 매칭 결과 초기화
  resetSteps: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoToStep: (step: number) => boolean;
}

// 유저별 매칭 스토어를 생성하는 함수
export const createUserMatchingStore = (userId: string) =>
  create<MatchingStepStore>()(
    persist(
      (set, get) => ({
        currentStep: 1,
        completedSteps: [],
        answers: {},
        aiMatchingResult: null,

        setCurrentStep: (step: number) => set({ currentStep: step }),

        setStepAnswer: (step: number, answer: StepAnswer) =>
          set((state) => ({
            answers: { ...state.answers, [step]: answer },
          })),

        markStepCompleted: (step: number) =>
          set((state) => ({
            completedSteps: state.completedSteps.includes(step)
              ? state.completedSteps
              : [...state.completedSteps, step],
          })),

        setAIMatchingResult: (result: AIRecommendResponse) =>
          set({ aiMatchingResult: result }),

        clearAIMatchingResult: () => set({ aiMatchingResult: null }),

        resetSteps: () =>
          set({
            currentStep: 1,
            completedSteps: [],
            answers: {},
            aiMatchingResult: null,
          }),

        goToNextStep: () => {
          const { currentStep } = get();
          if (currentStep < 10) {
            set({ currentStep: currentStep + 1 });
          }
        },

        goToPreviousStep: () => {
          const { currentStep } = get();
          if (currentStep > 1) {
            set({ currentStep: currentStep - 1 });
          }
        },

        canGoToStep: (step: number) => {
          const { completedSteps } = get();
          // 이전 단계가 완료되었거나, 바로 다음 단계인 경우에만 이동 가능
          return (
            step <= 1 ||
            completedSteps.includes(step - 1) ||
            step === get().currentStep + 1
          );
        },
      }),
      {
        name: `matching-step-storage-${userId}`, // 유저별 고유 키
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          answers: state.answers,
          aiMatchingResult: state.aiMatchingResult,
        }),
      }
    )
  );

// 스토어 인스턴스를 캐시하기 위한 Map
const storeCache = new Map<
  string,
  ReturnType<typeof createUserMatchingStore>
>();

// 유저별 매칭 스토어 훅
export const useMatchingStepStore = (userId?: string) => {
  // userId가 제공되지 않으면 "anonymous" 사용 (로그인하지 않은 경우)
  // 실제 프로덕션에서는 useAuth 훅을 직접 사용하는 것이 좋지만,
  // 하위 호환성을 위해 여기서는 기본값 처리
  const storeKey = userId || "anonymous";

  if (!storeCache.has(storeKey)) {
    storeCache.set(storeKey, createUserMatchingStore(storeKey));
  }

  return storeCache.get(storeKey)!();
};
