const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js');
if (fs.existsSync(target)) {
  const code = `import { requireOptionalNativeModule } from 'expo-modules-core';

const nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default nativeModule || fallbackModule;
`;
  fs.writeFileSync(target, code, 'utf8');
  console.log('[patch-notifications] Patched TopicSubscriptionModule.android.js for Expo Go compatibility');
}
