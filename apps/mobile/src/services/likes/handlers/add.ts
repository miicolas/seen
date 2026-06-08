import { eden, unwrapEden } from "@/lib/eden";

import type { LikeInput, LikeItem } from "../types";

export async function addLike(input: LikeInput): Promise<LikeItem> {
  return unwrapEden<LikeItem>(eden.likes.my.put(input));
}
