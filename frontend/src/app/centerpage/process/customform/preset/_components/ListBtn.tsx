"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { FormListItem } from "@/components/ui/FormListItem";

interface ListBtnProps {
  title: string;
  questionItems: string[];
  onItemSelect?: (selectedIndexes: number[], selectedTexts: string[]) => void;
}

export function ListBtn({ title, questionItems, onItemSelect }: ListBtnProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const handleItemSelect = (index: number) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(index)
        ? prev.filter((item) => item !== index) // 선택 해제
        : [...prev, index]; // 선택 추가

      // 다음 렌더링 사이클에서 부모 컴포넌트에 알림
      if (onItemSelect) {
        setTimeout(() => {
          const selectedTexts = newSelectedItems.map((i) => questionItems[i]);
          onItemSelect(newSelectedItems, selectedTexts);
        }, 0);
      }

      return newSelectedItems;
    });
  };

  return (
    <div className="w-full flex flex-col gap-2 py-1">
      <div className="w-full flex gap-2.5 items-center justify-between h-[42px]">
        <h3 className="w-full text-bk py-2">{title}</h3>
        <CaretDown
          className={`${
            !isOpen ? "rotate-180" : ""
          } text-gr w-5 h-5 transition-all duration-300`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && (
        <div className="w-full flex flex-col gap-1">
          {questionItems.map((item, index) => (
            <FormListItem
              key={index}
              leftIcon={null}
              selected={selectedItems.includes(index)}
              onClick={() => handleItemSelect(index)}
            >
              {item}
            </FormListItem>
          ))}
        </div>
      )}
    </div>
  );
}
