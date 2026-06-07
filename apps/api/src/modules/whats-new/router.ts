import { Elysia } from "elysia";

import { WhatsNewModel } from "./model";
import { getReleases } from "./queries";

// Public: the announcement content is not sensitive and the app only reads it.
export const whatsNewController = new Elysia({
  name: "WhatsNew.Controller",
  prefix: "/whats-new",
})
  .use(WhatsNewModel)
  .get("/", () => getReleases(), {
    response: { 200: "whatsNew.ReleaseList" },
  });
