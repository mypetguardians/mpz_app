"use client";

import { useState } from "react";
import { CustomModal } from "./CustomModal";
import { CustomInput } from "./CustomInput";
import { useUpdateAnimalStatus } from "@/hooks/mutation";

interface AnimalStatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  animalId: string;
  currentProtectionStatus?: string;
  currentAdoptionStatus?: string;
  onSuccess?: () => void;
}

export function AnimalStatusUpdateModal({
  isOpen,
  onClose,
  animalId,
  currentProtectionStatus = "",
  currentAdoptionStatus = "",
  onSuccess,
}: AnimalStatusUpdateModalProps) {
  const [protectionStatus, setProtectionStatus] = useState(
    currentProtectionStatus
  );
  const [adoptionStatus, setAdoptionStatus] = useState(currentAdoptionStatus);

  const updateStatusMutation = useUpdateAnimalStatus();

  const handleSubmit = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        animal_id: animalId,
        protection_status: protectionStatus || null,
        adoption_status: adoptionStatus || null,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="동물 상태 변경"
      confirmText="변경하기"
      cancelText="취소"
      onConfirm={handleSubmit}
      confirmDisabled={updateStatusMutation.isPending}
    >
      <div className="space-y-4">
        <CustomInput
          variant="tagdropdown"
          label="보호 상태"
          placeholder="보호 상태를 선택해주세요"
          options={["보호중", "안락사", "자연사", "반환"]}
          value={protectionStatus}
          onChangeOption={(value) => setProtectionStatus(value)}
        />

        <CustomInput
          variant="tagdropdown"
          label="입양 상태"
          placeholder="입양 상태를 선택해주세요"
          options={["입양가능", "입양진행중", "입양완료", "입양불가"]}
          value={adoptionStatus}
          onChangeOption={(value) => setAdoptionStatus(value)}
        />
      </div>
    </CustomModal>
  );
}
