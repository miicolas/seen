import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { PreferencesModel } from "./model";
import { recordOnboardingSwipes, setMyPreferences } from "./mutations";
import { getMyPreferences, getOnboardingNext, getOnboardingSeed } from "./queries";

export const preferencesController = new Elysia({
  name: "Preferences.Controller",
  prefix: "/preferences",
})
  .use(authGuard)
  .use(PreferencesModel)
  .get("/me", ({ user }) => getMyPreferences(user.id), {
    auth: true,
    response: { 200: "preferences.Me" },
  })
  .put("/me", ({ user, body }) => setMyPreferences(user.id, body), {
    auth: true,
    body: "preferences.Input",
    response: { 200: "preferences.Me" },
  })
  .get("/onboarding-seed", ({ user }) => getOnboardingSeed(user.id), {
    auth: true,
    response: { 200: "preferences.SeedList" },
  })
  .post("/onboarding-swipes", ({ user, body }) => recordOnboardingSwipes(user.id, body.items), {
    auth: true,
    body: "preferences.SwipeBatch",
    response: { 200: "preferences.SwipeResult" },
  })
  .post("/onboarding-next", ({ user, body }) => getOnboardingNext(user.id, body), {
    auth: true,
    body: "preferences.NextRequest",
    response: { 200: "preferences.SeedList" },
  });
