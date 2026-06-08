import { eden, unwrapEden } from "@/lib/eden";

import type { NotInterestedInput, NotInterestedItem } from "../types";

export async function dismiss(input: NotInterestedInput): Promise<NotInterestedItem> {
  return unwrapEden<NotInterestedItem>(eden["not-interested"].my.put(input));
}
