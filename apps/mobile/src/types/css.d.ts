// Allow side-effect and default imports of CSS under `moduleResolution: bundler`,
// which otherwise can't resolve non-JS/TS extensions (TS2882) on case-sensitive CI.
declare module "*.css";
