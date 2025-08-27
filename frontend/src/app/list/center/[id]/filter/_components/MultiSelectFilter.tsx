"use client";

import { MiniButton } from "@/components/ui/MiniButton";

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  layout?: "flex" | "grid";
  gridCols?: number;
  className?: string;
}

export default function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onSelectionChange,
  layout = "flex",
  gridCols = 4,
  className = "",
}: MultiSelectFilterProps) {
  const handleMultiSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((item) => item !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const getGridClassName = (cols: number) => {
    switch (cols) {
      case 2:
        return "grid grid-cols-2 gap-1";
      case 3:
        return "grid grid-cols-3 gap-1";
      case 4:
        return "grid grid-cols-3 gap-1";
      case 5:
        return "grid grid-cols-5 gap-1";
      case 6:
        return "grid grid-cols-6 gap-1";
      default:
        return "grid grid-cols-4 gap-1";
    }
  };

  const containerClassName =
    layout === "grid" ? getGridClassName(gridCols) : "flex flex-wrap gap-2";

  return (
    <div className="flex flex-col gap-1">
      <h5 className="text-dg">
        {title}{" "}
        {selectedValues.length > 0 && (
          <span className="text-brand">{selectedValues.length}</span>
        )}
      </h5>
      <div className={containerClassName}>
        {options.map((option) => (
          <MiniButton
            key={option}
            text={option}
            variant={selectedValues.includes(option) ? "filterOn" : "filterOff"}
            onClick={() => handleMultiSelect(option)}
            className={className}
          />
        ))}
      </div>
    </div>
  );
}
