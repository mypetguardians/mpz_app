import { useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

interface UpdateAdoptionMemoParams {
  adoptionId: string;
  center_notes?: string | null;
  user_memo?: string | null;
}

export const useUpdateAdoptionMemo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateAdoptionMemoParams): Promise<void> => {
      await instance.put(`/adoptions/center-admin/${params.adoptionId}/memo`, {
        center_notes: params.center_notes,
        user_memo: params.user_memo,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["center-adoptions"] });
      queryClient.invalidateQueries({
        queryKey: ["center-adoption", variables.adoptionId],
      });
    },
  });
};
