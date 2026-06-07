import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { ProfileModel } from "./model";
import { getAvatar, getMyProfileActivity, getOrCreateMyProfile } from "./queries";
import { deleteAvatar, updateMyProfile, uploadAvatar } from "./mutations";

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
    ({ user, query }) => getMyProfileActivity(user.id, query.limit, query.offset),
    {
      auth: true,
      query: "profile.ActivityQuery",
      response: {
        200: "profile.ActivityList",
      },
    },
  )
  .post("/me/avatar", ({ user, body }) => uploadAvatar(user.id, body.file), {
    auth: true,
    body: "profile.AvatarUploadBody",
    response: {
      200: "profile.AvatarUploadResponse",
    },
  })
  .delete("/me/avatar", ({ user, query }) => deleteAvatar(user.id, query.path), {
    auth: true,
    query: "profile.AvatarQuery",
    response: {
      200: "profile.DeleteResponse",
    },
  })
  .get("/avatar", ({ query }) => getAvatar(query.path), {
    query: "profile.AvatarQuery",
  });
