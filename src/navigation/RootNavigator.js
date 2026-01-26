import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getDeviceLocationOrNull } from "../utils/deviceLocation";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
import { api } from "../api/client";
import * as Notifications from "expo-notifications";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { booting, user, updateLocation } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  const isAuthed = !!user;
  const role = user?.role;

  // Seeker login olandan sonra (bir dəfə) telefonun default location permission pəncərəsini çıxart.
  // UI-ni bloklamır, user rədd etsə də tətbiq işləməyə davam edir.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!isAuthed || !user?.id) return;
      if (role !== "seeker") return;

      const hasLoc =
        user?.location && typeof user.location.lat === "number" && typeof user.location.lng === "number";
      if (hasLoc) return;

      const ASK_KEY = "ASIMOS_LOC_ASKED_V1";
      const asked = await AsyncStorage.getItem(ASK_KEY).catch(() => null);
      if (asked) return;

      await AsyncStorage.setItem(ASK_KEY, "1").catch(() => {});

      const loc = await getDeviceLocationOrNull({ timeoutMs: 12000 });
      if (!mounted) return;
      if (loc) {
        try { await updateLocation(loc); } catch {}
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthed, user?.id]);

  // Seeker üçün Push notification icazəsi + token save.
  // - İlk dəfə daxil olanda OS prompt açılır (bildiriş icazəsi).
  // - İcazə verilərsə: token backend-ə yazılır.
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!isAuthed || !user?.id) return;
      if (role !== "seeker") return;

      const ENABLE_KEY = "ASIMOS_NOTIF_ENABLED_V1";
      const ASKED_KEY = "ASIMOS_NOTIF_ASKED_V1";

      const enabledRaw = await AsyncStorage.getItem(ENABLE_KEY).catch(() => null);
      const asked = await AsyncStorage.getItem(ASKED_KEY).catch(() => null);

      // If user already explicitly disabled notifications, don't prompt again here.
      if (enabledRaw === "0") return;

      // If never asked before, prompt once automatically (point #3 requirement)
      if (!asked) {
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => {});
      }

      // If enabled is null (first run) we still try once and then persist 1/0.
      const tokenKey = "ASIMOS_EXPO_PUSH_TOKEN_V1";
      const token = await registerForPushNotificationsAsync();
      if (!mounted) return;

      if (!token) {
        if (enabledRaw === null) {
          await AsyncStorage.setItem(ENABLE_KEY, "0").catch(() => {});
        }
        return;
      }

      const prev = await AsyncStorage.getItem(tokenKey).catch(() => null);
      if (prev === token && enabledRaw === "1") return;

      try {
        await api.setPushToken(token);
        await AsyncStorage.setItem(tokenKey, token).catch(() => {});
        await AsyncStorage.setItem(ENABLE_KEY, "1").catch(() => {});
      } catch {
        // Ignore (backend might not have `expo_push_token` column)
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthed, user?.id, role]);

  // Push notification-a klikləyəndə JobDetail aç (foreground/background).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response?.notification?.request?.content?.data;
        const job = data?.job;
        if (data?.type === "job" && job && navigationRef.isReady()) {
          navigationRef.navigate("JobDetail", { job });
        }
      } catch {}
    });
    return () => sub?.remove?.();
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
            <Stack.Screen name="SeekerTabs" component={SeekerTabs} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
