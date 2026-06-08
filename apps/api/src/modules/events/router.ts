import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { EventsModel } from "./model";
import { applyOutcome, recordImpressions, recordInteractions } from "./mutations";
import { getRecommendationSuccessRate } from "./queries";

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export const eventsController = new Elysia({
  name: "Events.Controller",
  prefix: "/events",
})
  .use(authGuard)
  .use(EventsModel)
  .post("/", ({ user, body }) => recordInteractions(user.id, body.events), {
    auth: true,
    body: "events.TrackInput",
    response: {
      200: "events.InsertedResponse",
    },
  })
  .post("/impressions", ({ user, body }) => recordImpressions(user.id, body.impressions), {
    auth: true,
    body: "events.ImpressionsInput",
    response: {
      200: "events.InsertedResponse",
    },
  })
  .patch("/impressions/outcome", ({ user, body }) => applyOutcome(user.id, body), {
    auth: true,
    body: "events.OutcomeInput",
    response: {
      200: "events.RecommendationEvent",
    },
  })
  .get(
    "/success-rate",
    ({ user, query }) =>
      getRecommendationSuccessRate(user.id, parseDate(query.from), parseDate(query.to)),
    {
      auth: true,
      query: "events.SuccessRateQuery",
      response: {
        200: "events.SuccessRate",
      },
    },
  );
