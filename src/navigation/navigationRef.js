import { createNavigationContainerRef } from "@react-navigation/native";

// Shared navigation ref so we can navigate from push-notification handlers.
// (e.g. when user taps a notification while the app is backgrounded)
export const navigationRef = createNavigationContainerRef();
