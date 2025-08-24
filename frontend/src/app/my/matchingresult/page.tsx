import { Suspense } from "react";
import MatchingCompletePage from "./MatchingCompletePage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MatchingCompletePage />
    </Suspense>
  );
}
