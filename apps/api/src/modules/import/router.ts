import { Elysia } from "elysia";

import { authGuard } from "../../auth-plugin";
import { ImportModel } from "./model";
import { importFromFile, importFromRss, resolveUnmatched } from "./mutations";

export const importController = new Elysia({
  name: "Import.Controller",
  prefix: "/import",
})
  .use(authGuard)
  .use(ImportModel)
  .post("/letterboxd/file", ({ user, body }) => importFromFile(user.id, body.file), {
    auth: true,
    body: "import.FileBody",
    response: {
      200: "import.Summary",
    },
  })
  .post("/letterboxd/rss", ({ user, body }) => importFromRss(user.id, body.username), {
    auth: true,
    body: "import.RssBody",
    response: {
      200: "import.Summary",
    },
  })
  .post("/letterboxd/resolve", ({ user, body }) => resolveUnmatched(user.id, body.resolutions), {
    auth: true,
    body: "import.ResolveBody",
    response: {
      200: "import.Summary",
    },
  });
