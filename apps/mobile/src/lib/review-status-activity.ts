import { type LiveActivity } from "expo-widgets";

import ReviewStatusActivity, {
  type ReviewStatusAction,
  type ReviewStatusActivityProps,
  type ReviewStatusState,
} from "@/widgets/review-status-activity";

function startReviewStatusActivity(action: ReviewStatusAction) {
  try {
    for (const instance of ReviewStatusActivity.getInstances()) {
      void instance.end("immediate");
    }

    return ReviewStatusActivity.start(
      {
        action,
        state: "pending",
      },
      "seen://review",
    );
  } catch (error) {
    if (__DEV__) {
      console.warn("[ReviewStatusActivity] start failed", error);
    }
    return null;
  }
}

async function finishReviewStatusActivity(
  activity: LiveActivity<ReviewStatusActivityProps> | null,
  action: ReviewStatusAction,
  state: Exclude<ReviewStatusState, "pending">,
) {
  if (!activity) return;

  const props = { action, state };

  try {
    await activity.end("immediate", props);
  } catch (error) {
    if (__DEV__) {
      console.warn("[ReviewStatusActivity] finish failed", error);
    }
    // Live Activities can be disabled or unavailable; review mutations must keep working.
  }
}

export async function runReviewStatusActivity<T>(
  action: ReviewStatusAction,
  operation: () => Promise<T>,
) {
  const activity = startReviewStatusActivity(action);

  try {
    const result = await operation();
    await finishReviewStatusActivity(activity, action, "success");
    return result;
  } catch (error) {
    await finishReviewStatusActivity(activity, action, "error");
    throw error;
  }
}
