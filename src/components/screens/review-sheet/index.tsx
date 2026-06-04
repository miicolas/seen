import { useLocalSearchParams } from "expo-router";

import { ReviewSheetContainer } from "./review-sheet-container";
import {
  useReviewController,
  type ReviewSheetParams,
} from "./use-review-controller";

export function ReviewSheet() {
  const params = useLocalSearchParams<ReviewSheetParams>();
  const controller = useReviewController(params);

  return <ReviewSheetContainer controller={controller} />;
}
