import React from "react";

interface DropdownBottomSheetProps {
  open: boolean;
  onClose: () => void;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
}

export function DropdownBottomSheet({ open, onClose, options, selectedValue, onSelect }: DropdownBottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 transition-all">
      <div className="absolute inset-0" onClick={onClose} aria-label="닫기" />
      <div className="relative w-full max-w-[420px] bg-white rounded-t-2xl shadow-xl animate-slideup">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />

        <div className="flex flex-col px-4 pt-4 pb-5 h-full">
          {/* 옵션 목록 */}
          <div className="flex-1 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelect(option)}
                className={`w-full h-[50px] py-3 text-left body ${selectedValue === option ? "text-brand" : "text-bk"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideup {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        .animate-slideup {
          animation: slideup 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
