import { eden, unwrapEden } from "@/lib/eden";

import type { NotInterestedItem } from "../types";

export async function listMyItems(): Promise<NotInterestedItem[]> {
  return unwrapEden<NotInterestedItem[]>(eden["not-interested"].get());
}
