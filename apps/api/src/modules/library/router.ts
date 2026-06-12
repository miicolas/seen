import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { LibraryModel } from "./model";
import { getMemberships } from "./queries";

export const libraryController = new Elysia({
  name: "Library.Controller",
  prefix: "/library",
})
  .use(authGuard)
  .use(LibraryModel)
  .get("/memberships", ({ user }) => getMemberships(user.id), {
    auth: true,
    response: {
      200: "library.Memberships",
    },
  });
