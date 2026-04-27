/**
 * 숫자에 천 단위 콤마를 추가합니다.
 * @example numberWithComma(1200222) → "1,200,222"
 * @example numberWithComma("1200222") → "1,200,222"
 * @example numberWithComma(null) → ""
 */
export function numberWithComma(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
}
