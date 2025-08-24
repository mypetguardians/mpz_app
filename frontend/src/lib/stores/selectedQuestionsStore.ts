import { create } from "zustand";

interface QuestionInput {
  text: string;
  isCustom: boolean;
}

interface SelectedQuestionsStore {
  selectedQuestions: string[];
  customQuestions: QuestionInput[];
  setQuestions: (questions: string[]) => void;
  setCustomQuestions: (questions: QuestionInput[]) => void;
  clearQuestions: () => void;
  clearCustomQuestions: () => void;
}

export const useSelectedQuestionsStore = create<SelectedQuestionsStore>((set) => ({
  selectedQuestions: [],
  customQuestions: [],
  setQuestions: (questions: string[]) => set({ selectedQuestions: questions }),
  setCustomQuestions: (questions: QuestionInput[]) => set({ customQuestions: questions }),
  clearQuestions: () => set({ selectedQuestions: [] }),
  clearCustomQuestions: () => set({ customQuestions: [] }),
}));
