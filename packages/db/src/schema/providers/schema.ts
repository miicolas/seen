import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "../auth";

export const providers = pgTable("providers", {
  providerId: bigint("provider_id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  logoPath: text("logo_path"),
  displayPriority: integer("display_priority"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const mediaProviders = pgTable(
  "media_providers",
  {
    tmdbId: bigint("tmdb_id", { mode: "number" }).notNull(),
    mediaType: text("media_type").notNull(),
    region: text("region").notNull(),
    providerId: bigint("provider_id", { mode: "number" }).notNull(),
    offerType: text("offer_type").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    primaryKey({
      columns: [table.tmdbId, table.mediaType, table.region, table.providerId, table.offerType],
    }),
    index("media_providers_region_provider_idx").on(table.region, table.providerId),
    check("media_providers_media_type_check", sql`${table.mediaType} in ('movie', 'tv')`),
    check(
      "media_providers_offer_type_check",
      sql`${table.offerType} in ('flatrate', 'rent', 'buy', 'ads', 'free')`,
    ),
  ],
);

export const userPlatforms = pgTable(
  "user_platforms",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: bigint("provider_id", { mode: "number" })
      .notNull()
      .references(() => providers.providerId, { onDelete: "cascade" }),
    region: text("region").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("user_platforms_user_provider_region_unique").on(
      table.userId,
      table.providerId,
      table.region,
    ),
    index("user_platforms_user_idx").on(table.userId),
    index("user_platforms_user_region_idx").on(table.userId, table.region),
  ],
);
