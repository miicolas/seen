import { useLocalSearchParams } from "expo-router";

import { ReviewComposeContainer } from "./review-compose-container";
import { useReviewController, type ReviewSheetParams } from "./use-review-controller";

export function ReviewComposeSheet() {
  const params = useLocalSearchParams<ReviewSheetParams>();
  const controller = useReviewController(params);

  return <ReviewComposeContainer controller={controller} />;
}
