module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    // react-native-worklets/plugin debe ir SIEMPRE último (requisito de reanimated v4).
    plugins: ['react-native-worklets/plugin'],
  };
};
