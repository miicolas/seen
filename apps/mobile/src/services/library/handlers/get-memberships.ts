import { eden, unwrapEden } from "@/lib/eden";

import type { LibraryMemberships } from "../types";

export async function getLibraryMemberships(): Promise<LibraryMemberships> {
  return unwrapEden<LibraryMemberships>(eden.library.memberships.get());
}
