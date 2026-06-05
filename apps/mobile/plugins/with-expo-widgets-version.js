const { withXcodeProject } = require("expo/config-plugins");

const WIDGETS_BUNDLE_IDENTIFIER = "app.seen.com.ExpoWidgetsTarget";

module.exports = function withExpoWidgetsVersion(config) {
  return withXcodeProject(config, (config) => {
    const version = config.ios?.version ?? config.version;
    const buildNumber = config.ios?.buildNumber ?? "1";

    if (!version) return config;

    const buildConfigurations = config.modResults.pbxXCBuildConfigurationSection();

    for (const buildConfiguration of Object.values(buildConfigurations)) {
      if (!buildConfiguration || typeof buildConfiguration !== "object") continue;

      const buildSettings = buildConfiguration.buildSettings;
      if (!buildSettings) continue;

      const bundleIdentifier = String(buildSettings.PRODUCT_BUNDLE_IDENTIFIER).replaceAll('"', "");

      if (bundleIdentifier !== WIDGETS_BUNDLE_IDENTIFIER) {
        continue;
      }

      buildSettings.MARKETING_VERSION = `"${version}"`;
      buildSettings.CURRENT_PROJECT_VERSION = `"${buildNumber}"`;
    }

    return config;
  });
};
