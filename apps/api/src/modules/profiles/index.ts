import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { ProfileModel } from "./model";
import {
  deleteMyAccount,
  getMyProfileActivity,
  getOrCreateMyProfile,
  updateMyProfile,
} from "./service";
import {
  deleteAvatarObject,
  getAvatarObject,
  uploadAvatarObject,
} from "../../lib/s3";

export const profileController = new Elysia({
  name: "Profile.Controller",
  prefix: "/profiles",
})
  .use(authGuard)
  .use(ProfileModel)
  .get("/me", ({ user }) => getOrCreateMyProfile(user), {
    auth: true,
    response: {
      200: "profile.Profile",
    },
  })
  .patch("/me", ({ user, body }) => updateMyProfile(user.id, body), {
    auth: true,
    body: "profile.UpdateBody",
    response: {
      200: "profile.Profile",
    },
  })
  .get(
    "/me/activity",
    ({ user, query }) => getMyProfileActivity(user.id, query.limit),
    {
      auth: true,
      query: "profile.ActivityQuery",
      response: {
        200: "profile.ActivityList",
      },
    },
  )
  .post(
    "/me/avatar",
    async ({ user, body }) => {
      const path = await uploadAvatarObject(user.id, body.file);
      return { path };
    },
    {
      auth: true,
      body: "profile.AvatarUploadBody",
      response: {
        200: "profile.AvatarUploadResponse",
      },
    },
  )
  .delete(
    "/me/avatar",
    async ({ user, query }) => {
      await deleteAvatarObject(user.id, query.path);
      return { ok: true };
    },
    {
      auth: true,
      query: "profile.AvatarQuery",
      response: {
        200: "profile.DeleteResponse",
      },
    },
  )
  .get(
    "/avatar",
    ({ user, query }) => getAvatarObject(user.id, query.path),
    {
      auth: true,
      query: "profile.AvatarQuery",
    },
  )
  .delete("/me", async ({ user }) => {
    await deleteMyAccount(user.id);
    return { ok: true };
  }, {
    auth: true,
    response: {
      200: "profile.DeleteResponse",
    },
  });
