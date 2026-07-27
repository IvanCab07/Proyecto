const { withAndroidColors, AndroidConfig } = require('expo/config-plugins');

const { assignColorValue } = AndroidConfig.Colors;

/**
 * Pinta los colores nativos de Android con los de la marca.
 *
 * `colorPrimary` tiñe widgets nativos que el JS no controla —los manijas de selección de texto,
 * el ripple de algunos componentes— y la plantilla de Expo lo deja en un azul (#023c69) que no
 * tiene nada que ver con el proyecto. `colorPrimaryDark` es el de la barra de estado.
 *
 * Va como config plugin y no editando android/app/src/main/res/values/colors.xml a mano porque
 * esa carpeta la regenera `expo prebuild`: la edición manual se pierde en silencio y volvés a
 * tener los azules sin enterarte. Que es exactamente lo que había pasado en este repo.
 *
 * Los valores salen de app.config.ts, que a su vez espeja los tokens de la web.
 */
module.exports = function withColoresMarca(config, { primary, primaryDark }) {
  return withAndroidColors(config, (cfg) => {
    cfg.modResults = assignColorValue(cfg.modResults, { name: 'colorPrimary', value: primary });
    cfg.modResults = assignColorValue(cfg.modResults, { name: 'colorPrimaryDark', value: primaryDark });
    return cfg;
  });
};
