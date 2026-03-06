const config = require("./app.json");

// EXPO_PUBLIC_BASE_URL is set in CI (e.g. "/bb-study-app" for GitHub Pages).
// Locally it's empty so the dev server still works at /.
const baseUrl = process.env.EXPO_PUBLIC_BASE_URL ?? "";

module.exports = () => ({
  ...config.expo,
  experiments: {
    ...config.expo.experiments,
    baseUrl,
  },
  web: {
    ...config.expo.web,
    // "single" generates a static SPA (no SSR). Safe for both dev and export.
    output: "single",
  },
});
