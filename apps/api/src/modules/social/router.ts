import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { SocialModel } from "./model";
import {
  getFollowers,
  getFollowing,
  getFollowingActivity,
  getIncomingRequests,
  getSocialProfile,
  getSocialProfileActivity,
  getSocialProfileWatchlist,
  searchProfiles,
} from "./queries";
import {
  approveAllFollowRequests,
  approveFollowRequest,
  followProfile,
  matchContacts,
  rejectFollowRequest,
  unfollowProfile,
} from "./mutations";

export const socialController = new Elysia({
  name: "Social.Controller",
  prefix: "/social",
})
  .use(authGuard)
  .use(SocialModel)
  // Static routes are declared before `/profiles/:profileId` so they win the match.
  .get(
    "/profiles/search",
    ({ user, query }) => searchProfiles(user.id, query.q, query.limit, query.offset),
    {
      auth: true,
      query: "social.SearchQuery",
      response: { 200: "social.ProfileList" },
    },
  )
  .get("/activity", ({ user, query }) => getFollowingActivity(user.id, query.limit, query.offset), {
    auth: true,
    query: "social.PageQuery",
    response: { 200: "social.ActivityList" },
  })
  .get("/requests", ({ user, query }) => getIncomingRequests(user.id, query.limit, query.offset), {
    auth: true,
    query: "social.PageQuery",
    response: { 200: "social.RequestList" },
  })
  .post("/requests/approve-all", ({ user }) => approveAllFollowRequests(user.id), {
    auth: true,
    response: { 200: "social.ApproveAllResponse" },
  })
  .post(
    "/requests/:requestId/approve",
    ({ user, params }) => approveFollowRequest(user.id, params.requestId),
    {
      auth: true,
      response: { 200: "social.OkResponse" },
    },
  )
  .post(
    "/requests/:requestId/reject",
    ({ user, params }) => rejectFollowRequest(user.id, params.requestId),
    {
      auth: true,
      response: { 200: "social.OkResponse" },
    },
  )
  .post("/contacts/match", ({ user, body }) => matchContacts(user.id, body.identifiers), {
    auth: true,
    body: "social.ContactsMatchBody",
    response: { 200: "social.ContactMatchList" },
  })
  .get("/profiles/:profileId", ({ user, params }) => getSocialProfile(user.id, params.profileId), {
    auth: true,
    response: { 200: "social.Profile" },
  })
  .get(
    "/profiles/:profileId/activity",
    ({ user, params, query }) =>
      getSocialProfileActivity(user.id, params.profileId, query.limit, query.offset),
    {
      auth: true,
      query: "social.PageQuery",
      response: { 200: "social.ActivityList" },
    },
  )
  .get(
    "/profiles/:profileId/watchlist",
    ({ user, params, query }) =>
      getSocialProfileWatchlist(user.id, params.profileId, query.limit, query.offset),
    {
      auth: true,
      query: "social.PageQuery",
      response: { 200: "social.WatchlistPage" },
    },
  )
  .get(
    "/profiles/:profileId/followers",
    ({ user, params, query }) => getFollowers(user.id, params.profileId, query.limit, query.offset),
    {
      auth: true,
      query: "social.PageQuery",
      response: { 200: "social.ProfileList" },
    },
  )
  .get(
    "/profiles/:profileId/following",
    ({ user, params, query }) => getFollowing(user.id, params.profileId, query.limit, query.offset),
    {
      auth: true,
      query: "social.PageQuery",
      response: { 200: "social.ProfileList" },
    },
  )
  .post(
    "/profiles/:profileId/follow",
    ({ user, params }) => followProfile(user.id, params.profileId),
    {
      auth: true,
      response: { 200: "social.FollowResult" },
    },
  )
  .delete(
    "/profiles/:profileId/follow",
    ({ user, params }) => unfollowProfile(user.id, params.profileId),
    {
      auth: true,
      response: { 200: "social.UnfollowResult" },
    },
  );
