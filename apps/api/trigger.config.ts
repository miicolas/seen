import { defineConfig } from "@trigger.dev/sdk";

// Tasks run on the Trigger.dev Node runtime (they import @seen/db / node-postgres).
// The API process itself runs on Bun and only *enqueues* tasks via the SDK's HTTP
// client (see src/lib/trigger.ts), which is runtime-agnostic.
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_seen_placeholder",
  runtime: "node",
  dirs: ["./src/trigger"],
});
