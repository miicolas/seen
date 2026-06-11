import { task } from "@trigger.dev/sdk";
import { db } from "@seen/db";
import { watchSessionInvitations } from "@seen/db/schema";
import { and, eq, lte } from "@seen/db/orm";

export const expireWatchInvitationTask = task({
  id: "expire-watch-invitation",
  run: async (payload: { invitationId: string }) => {
    const updated = await db
      .update(watchSessionInvitations)
      .set({ status: "expired" })
      .where(
        and(
          eq(watchSessionInvitations.id, payload.invitationId),
          eq(watchSessionInvitations.status, "pending"),
          lte(watchSessionInvitations.expiresAt, new Date()),
        ),
      )
      .returning({ id: watchSessionInvitations.id });
    return { expired: updated.length > 0 };
  },
});
