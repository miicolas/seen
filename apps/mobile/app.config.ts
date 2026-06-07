import { execSync } from "node:child_process";

import type { ConfigContext, ExpoConfig } from "expo/config";

// Marketing version (CFBundleShortVersionString) from the latest git tag, e.g. "v0.1.0" -> "0.1.0".
// Build number (CFBundleVersion) from the total commit count, so every local build is unique.
// Wrapped in try/catch so builds without git history (e.g. EAS cloud shallow clones) fall back
// to the static values in app.json instead of crashing config evaluation.
function git(command: string): string | null {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function gitVersion(fallback: string): string {
  const tag = git("git describe --tags --abbrev=0");
  return tag ? tag.replace(/^v/, "") : fallback;
}

function gitBuildNumber(fallback: string): string {
  return git("git rev-list --count HEAD") ?? fallback;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const version = gitVersion(config.version ?? "1.0.0");
  const buildNumber = gitBuildNumber(config.ios?.buildNumber ?? "1");

  return {
    ...config,
    name: config.name ?? "Seen",
    slug: config.slug ?? "seenbox",
    version,
    ios: {
      ...config.ios,
      buildNumber,
    },
  };
};
