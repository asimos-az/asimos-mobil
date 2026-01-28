import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import { AuthEntryScreen } from "../screens/auth/AuthEntryScreen";
import { VerifyOtpScreen } from "../screens/auth/VerifyOtpScreen";
import { EmployerTabs } from "./EmployerTabs";
import { SeekerTabs } from "./SeekerTabs";
import { EmployerCreateJobScreen } from "../screens/employer/EmployerCreateJobScreen";
import { EmployerNotificationsScreen } from "../screens/employer/EmployerNotificationsScreen";
import { EmployerMapScreen } from "../screens/employer/EmployerMapScreen";
import { JobDetailScreen } from "../screens/shared/JobDetailScreen";
import { LaunchSplashScreen } from "../screens/shared/LaunchSplashScreen";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
import { api } from "../api/client";
import { LocationAutoScreen } from "../screens/shared/LocationAutoScreen";
import { DeviceEventEmitter } from "react-native";
import { SeekerNotificationsScreen } from "../screens/seeker/SeekerNotificationsScreen";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { booting, user } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  const isAuthed = !!user;
  const role = user?.role;

  const needsSeekerLocation =
    isAuthed && role === "seeker" &&
    !(user?.location && typeof user.location.lat === "number" && typeof user.location.lng === "number");

  // NOTE: Location permission and auto-detect flow is handled via LocationAutoScreen
  // (shown for seekers until location is saved).

  // Push notifications
  // 1) First login -> show OS permission prompt once and sync switch state.
  // 2) Later -> only refresh token when notifications are enabled.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!isAuthed || !user?.id) return;

      const ASKED_KEY = "ASIMOS_NOTIF_ASKED_V1";
      const ENABLED_KEY = "ASIMOS_NOTIF_ENABLED_V1";
      const TOKEN_KEY = "ASIMOS_EXPO_PUSH_TOKEN_V1";

      const asked = await AsyncStorage.getItem(ASKED_KEY).catch(() => null);
      const enabled = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);

      // If user manually disabled notifications, do nothing.
      if (enabled === "0") {
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => {});
        return;
      }

      // If OS permission already granted (e.g., user enabled in Settings),
      // make sure our in-app switch is ON and token is synced.
      const perm = await Notifications.getPermissionsAsync().catch(() => ({ status: "undetermined" }));
      if (perm?.status === "granted") {
        const token = await registerForPushNotificationsAsync();
        if (!mounted) return;
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => {});
        if (token) {
          await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => {});
          const prev = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
          if (prev !== token) {
            try { await api.setPushToken(token); } catch {}
            await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
          }
        }
        return;
      }

      // Permission not granted. Only prompt once on first login.
      if (asked !== "1") {
        const token = await registerForPushNotificationsAsync();
        if (!mounted) return;
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => {});
        if (token) {
          await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => {});
          await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
          try { await api.setPushToken(token); } catch {}
        } else {
          // User denied -> keep switch OFF (but can be turned ON manually later)
          await AsyncStorage.setItem(ENABLED_KEY, "0").catch(() => {});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthed, user?.id]);

  // When a push notification is tapped, open the related page.
  useEffect(() => {
    let sub = null;

    const handle = async (response) => {
      try {
        const data = response?.notification?.request?.content?.data || {};
        if (data?.type === "job" && data?.jobId) {
          // Fetch job fresh (so it matches current API model)
          const job = await api.getJobById(data.jobId).catch(() => null);
          if (job) {
            if (navigationRef.isReady()) navigationRef.navigate("JobDetail", { job });
            return;
          }
        }
        // fallback -> open notifications inbox if seeker
        if (navigationRef.isReady() && role === "seeker") navigationRef.navigate("SeekerNotifications");
      } catch {
        if (navigationRef.isReady() && role === "seeker") navigationRef.navigate("SeekerNotifications");
      }
    };

    (async () => {
      // Handle initial open (killed -> opened by push)
      const last = await Notifications.getLastNotificationResponseAsync().catch(() => null);
      if (last) handle(last);
      sub = Notifications.addNotificationResponseReceivedListener(handle);
    })();

    return () => {
      try { sub?.remove(); } catch {}
    };
  }, [role]);

  // When a push notification arrives while the app is running, notify screens to refresh
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      try { DeviceEventEmitter.emit("asimos:pushReceived"); } catch {}
    });
    return () => {
      try { sub?.remove(); } catch {}
    };
  }, []);

  // While auth state is loading, show splash
  if (booting) {
    return <LaunchSplashScreen onDone={() => {}} minMs={1200} />;
  }

  // After boot, show splash once briefly
  if (showSplash) {
    return <LaunchSplashScreen onDone={() => setShowSplash(false)} minMs={850} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <>
            <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        ) : role === "employer" ? (
          <>
            <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
            <Stack.Screen name="EmployerCreateJob" component={EmployerCreateJobScreen} />
            <Stack.Screen name="EmployerNotifications" component={EmployerNotificationsScreen} />
            <Stack.Screen name="EmployerMap" component={EmployerMapScreen} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          </>
        ) : (
          <>
            {needsSeekerLocation ? (
              <Stack.Screen name="LocationAuto" component={LocationAutoScreen} />
            ) : (
              <Stack.Screen name="SeekerTabs" component={SeekerTabs} />
            )}
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="SeekerNotifications" component={SeekerNotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
