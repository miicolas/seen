import { eden, unwrapEden } from "@/lib/eden";

import type { Review, ReviewInput } from "../types";

export async function upsertReview(input: ReviewInput): Promise<Review> {
  return unwrapEden<Review>(eden.reviews.my.put(input));
}
