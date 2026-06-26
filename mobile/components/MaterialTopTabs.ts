import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Navegador de pestañas con deslizamiento (swipe) expuesto a expo-router.
// Se usa con la barra inferior custom (tabBarPosition="bottom").
const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);
