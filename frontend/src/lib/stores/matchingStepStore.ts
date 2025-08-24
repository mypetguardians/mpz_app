import { create } from "zustand";
import { persist } from "zustand/middleware";

// 각 단계별 답변 타입 정의
type StepAnswer =
  | { type: "activity"; value: number }
  | { type: "space"; value: number }
  | { type: "age"; value: number }
  | { type: "gender"; value: number }
  | { type: "sensitivity"; value: number }
  | { type: "size"; value: number }
  | { type: "experience"; value: number }
  | { type: "time"; value: number }
  | { type: "budget"; value: number }
  | { type: "custom"; value: string };

interface MatchingStepStore {
  currentStep: number;
  completedSteps: number[];
  answers: Record<number, StepAnswer>;
  setCurrentStep: (step: number) => void;
  setStepAnswer: (step: number, answer: StepAnswer) => void;
  markStepCompleted: (step: number) => void;
  resetSteps: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoToStep: (step: number) => boolean;
}

export const useMatchingStepStore = create<MatchingStepStore>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      completedSteps: [],
      answers: {},

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

      resetSteps: () =>
        set({
          currentStep: 1,
          completedSteps: [],
          answers: {},
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
      name: "matching-step-storage",
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        answers: state.answers,
      }),
    }
  )
);
