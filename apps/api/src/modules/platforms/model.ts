import { Elysia, t } from "elysia";
import type { Static } from "@sinclair/typebox";

const providerRef = t.Object({
  providerId: t.Number(),
  name: t.String(),
  logoPath: t.Nullable(t.String()),
});

const userPlatforms = t.Object({
  region: t.String(),
  providers: t.Array(providerRef),
});

const setUserPlatformsInput = t.Object({
  region: t.String({ minLength: 2, maxLength: 4 }),
  providerIds: t.Array(t.Number(), { maxItems: 100 }),
});

export const PlatformsModel = new Elysia({ name: "Platforms.Model" }).model({
  "platforms.ProviderRef": providerRef,
  "platforms.ProviderList": t.Array(providerRef),
  "platforms.UserPlatforms": userPlatforms,
  "platforms.RegionQuery": t.Object({
    region: t.Optional(t.String({ minLength: 2, maxLength: 4 })),
  }),
  "platforms.SetUserPlatformsInput": setUserPlatformsInput,
});

export type ProviderRefDto = Static<typeof providerRef>;
export type UserPlatformsDto = Static<typeof userPlatforms>;
export type SetUserPlatformsInputDto = Static<typeof setUserPlatformsInput>;
