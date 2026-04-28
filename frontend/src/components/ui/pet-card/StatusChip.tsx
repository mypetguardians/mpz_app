import { Chip } from "../Chip";

interface StatusChipProps {
  text: string;
  colorClass: string;
}

export function StatusChip({ text, colorClass }: StatusChipProps) {
  return <Chip className={colorClass}>{text}</Chip>;
}
