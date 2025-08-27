import { redirect } from "next/navigation";

/** @TODO 구독자전용 > 전문가 분석 필터 사용시 뜨는 페이지 로직 추후 추가 */

export default function ListPage() {
  redirect("/list/animal");
}
