import { create } from "zustand";
import { persist } from "zustand/middleware";

// 입양 신청 단계별 데이터 타입
export interface AdoptionVerificationData {
  // Step 1-4에서 수집되는 기본 정보 (서버에서 가져온 사용자 정보로 자동 채움)
  phone?: string;
  phoneVerification?: boolean;
  name?: string;
  birth?: string; // YYYY-MM-DD 형식
  address?: string;

  // Step 5부터 추가로 수집되는 정보
  occupation?: string;
  income?: string;
  familyMembers?: string;
  housingType?: string;
  hasYard?: boolean;
  petExperience?: string;
  adoptionReason?: string;
  preparedness?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  agreement?: {
    terms: boolean;
    privacy: boolean;
    adoption: boolean;
  };

  // 메타 정보
  animalId?: string;
  centerId?: string;
  applicationDate?: string;
}

interface AdoptionVerificationStore {
  currentStep: number;
  completedSteps: number[];
  data: AdoptionVerificationData;
  isUserDataLoaded: boolean; // 사용자 정보가 로드되었는지 여부

  // 기본 스토어 액션
  setCurrentStep: (step: number) => void;
  setStepData: (stepData: Partial<AdoptionVerificationData>) => void;
  markStepCompleted: (step: number) => void;
  resetStore: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoToStep: (step: number) => boolean;

  // 사용자 정보 자동 채우기
  loadUserData: (userData: {
    phone?: string;
    phoneVerification?: boolean;
    name?: string;
    birth?: string;
    address?: string;
  }) => void;

  // 동물 및 센터 정보 설정
  setAnimalInfo: (animalId: string, centerId: string) => void;

  // 특정 필드 업데이트
  updateField: <K extends keyof AdoptionVerificationData>(
    field: K,
    value: AdoptionVerificationData[K]
  ) => void;
}

// 유저별 입양 신청 스토어를 생성하는 함수
export const createUserAdoptionVerificationStore = (userId: string) =>
  create<AdoptionVerificationStore>()(
    persist(
      (set, get) => ({
        currentStep: 1,
        completedSteps: [],
        data: {},
        isUserDataLoaded: false,

        setCurrentStep: (step: number) => set({ currentStep: step }),

        setStepData: (stepData: Partial<AdoptionVerificationData>) =>
          set((state) => ({
            data: { ...state.data, ...stepData },
          })),

        markStepCompleted: (step: number) =>
          set((state) => ({
            completedSteps: state.completedSteps.includes(step)
              ? state.completedSteps
              : [...state.completedSteps, step].sort((a, b) => a - b),
          })),

        resetStore: () =>
          set({
            currentStep: 1,
            completedSteps: [],
            data: {},
            isUserDataLoaded: false,
          }),

        goToNextStep: () => {
          const { currentStep } = get();
          const maxStep = 10; // 총 단계 수 (필요에 따라 조정)
          if (currentStep < maxStep) {
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
          const { completedSteps, isUserDataLoaded } = get();

          // step 1-4는 사용자 정보가 로드되면 자동으로 완료된 것으로 간주
          if (step <= 4 && isUserDataLoaded) {
            return true;
          }

          // 이전 단계가 완료되었거나, 바로 다음 단계인 경우에만 이동 가능
          return (
            step <= 1 ||
            completedSteps.includes(step - 1) ||
            step === get().currentStep + 1
          );
        },

        loadUserData: (userData) => {
          set((state) => ({
            data: {
              ...state.data,
              phone: userData.phone,
              phoneVerification: userData.phoneVerification,
              name: userData.name,
              birth: userData.birth,
              address: userData.address,
            },
            isUserDataLoaded: true,
            // 사용자 정보가 모두 있으면 1-4단계를 완료된 것으로 마크
            completedSteps:
              userData.phone &&
              userData.phoneVerification &&
              userData.name &&
              userData.birth &&
              userData.address
                ? [1, 2, 3, 4]
                : state.completedSteps,
            // 사용자 정보가 모두 있고 전화번호 인증이 완료되었으면 step 5로 이동
            currentStep:
              userData.phone &&
              userData.phoneVerification &&
              userData.name &&
              userData.birth &&
              userData.address
                ? 5
                : state.currentStep,
          }));
        },

        setAnimalInfo: (animalId: string, centerId: string) =>
          set((state) => ({
            data: {
              ...state.data,
              animalId,
              centerId,
              applicationDate: new Date().toISOString(),
            },
          })),

        updateField: (field, value) =>
          set((state) => ({
            data: {
              ...state.data,
              [field]: value,
            },
          })),
      }),
      {
        name: `adoption-verification-storage-${userId}`, // 유저별 고유 키
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          data: state.data,
          isUserDataLoaded: state.isUserDataLoaded,
        }),
      }
    )
  );

// 스토어 인스턴스를 캐시하기 위한 Map
const adoptionStoreCache = new Map<
  string,
  ReturnType<typeof createUserAdoptionVerificationStore>
>();

// 유저별 입양 신청 스토어 훅
export const useAdoptionVerificationStore = (userId?: string) => {
  const storeKey = userId || "anonymous";

  if (!adoptionStoreCache.has(storeKey)) {
    adoptionStoreCache.set(
      storeKey,
      createUserAdoptionVerificationStore(storeKey)
    );
  }

  return adoptionStoreCache.get(storeKey)!();
};

// 편의를 위한 타입 export
export type { AdoptionVerificationStore };
