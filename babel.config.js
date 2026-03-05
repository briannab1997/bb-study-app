module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-worklets/plugin is already injected by nativewind/babel (via react-native-css-interop)
    // Adding react-native-reanimated/plugin (which is now an alias for worklets/plugin in v4)
    // would run the worklet transform twice, corrupting easing functions on web
    plugins: [],
  };
};
