import { db } from "@seen/db";
import { followRequests, profiles } from "@seen/db/schema";
import { and, desc, eq } from "@seen/db/orm";

import { getViewerState, getViewerStates, normalizePagination, toProfileCard } from "../shared";
import { getSocialContexts } from "../social-context";

// Pending follow requests addressed to the viewer, newest first, each with the
// requester's profile card.
export async function getIncomingRequests(viewerId: string, limit = 30, offset = 0) {
  const { pageSize, offset: from } = normalizePagination(limit, offset);

  const rows = await db
    .select({ request: followRequests, requester: profiles })
    .from(followRequests)
    .innerJoin(profiles, eq(profiles.id, followRequests.requesterId))
    .where(and(eq(followRequests.targetId, viewerId), eq(followRequests.status, "pending")))
    .orderBy(desc(followRequests.createdAt))
    .limit(pageSize)
    .offset(from);

  const requesterIds = rows.map((entry) => entry.requester.id);
  const [states, contexts] = await Promise.all([
    getViewerStates(viewerId, requesterIds),
    getSocialContexts(viewerId, requesterIds),
  ]);

  return rows.map((entry) => ({
    id: entry.request.id,
    created_at: entry.request.createdAt.toISOString(),
    status: entry.request.status as "pending" | "approved" | "rejected",
    requester: toProfileCard(
      entry.requester,
      viewerId,
      getViewerState(states, entry.requester.id),
      contexts.get(entry.requester.id),
    ),
  }));
}
