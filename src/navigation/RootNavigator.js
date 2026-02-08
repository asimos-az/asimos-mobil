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
import { SeekerMapScreen } from "../screens/seeker/SeekerMapScreen";
import { JobDetailScreen } from "../screens/shared/JobDetailScreen";
import { TermsScreen } from "../screens/shared/TermsScreen";
import { JobMapScreen } from "../screens/shared/JobMapScreen";
import { LaunchSplashScreen } from "../screens/shared/LaunchSplashScreen";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";
import { api } from "../api/client";
import { LocationAutoScreen } from "../screens/shared/LocationAutoScreen";
import { DeviceEventEmitter } from "react-native";
import { SeekerNotificationsScreen } from "../screens/seeker/SeekerNotificationsScreen";
import JobAlertsScreen from "../screens/seeker/JobAlertsScreen";
import CreateJobAlertScreen from "../screens/seeker/CreateJobAlertScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { navigationRef } from "./navigationRef";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { booting, user } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  const isAuthed = !!user;
  const role = user?.role;

  const needsLocation =
    isAuthed &&
    !(user?.location && typeof user.location.lat === "number" && typeof user.location.lng === "number");


  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!isAuthed || !user?.id) return;

      const ASKED_KEY = "ASIMOS_NOTIF_ASKED_V2";
      const ENABLED_KEY = "ASIMOS_NOTIF_ENABLED_V2";
      const TOKEN_KEY = "ASIMOS_EXPO_PUSH_TOKEN_V2";

      const asked = await AsyncStorage.getItem(ASKED_KEY).catch(() => null);
      const enabled = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);

      if (enabled === "0") {
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => { });
        return;
      }

      const perm = await Notifications.getPermissionsAsync().catch(() => ({ status: "undetermined" }));
      if (perm?.status === "granted") {
        const token = await registerForPushNotificationsAsync();
        if (!mounted) return;
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => { });
        if (token) {
          await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => { });
          const prev = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
          if (prev !== token) {
            try { await api.setPushToken(token); } catch { }
            await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => { });
          }
        }
        return;
      }

      if (asked !== "1") {
        const token = await registerForPushNotificationsAsync();
        if (!mounted) return;
        await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => { });
        if (token) {
          await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => { });
          await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => { });
          try { await api.setPushToken(token); } catch { }
        } else {
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAuthed, user?.id]);

  useEffect(() => {
    let sub = null;

    const handle = async (response) => {
      try {
        const data = response?.notification?.request?.content?.data || {};
        if (data?.type === "job" && data?.jobId) {
          const job = await api.getJobById(data.jobId).catch(() => null);
          if (job) {
            if (navigationRef.isReady()) navigationRef.navigate("JobDetail", { job });
            return;
          }
        }
        if (navigationRef.isReady() && role === "seeker") navigationRef.navigate("SeekerNotifications");
      } catch {
        if (navigationRef.isReady() && role === "seeker") navigationRef.navigate("SeekerNotifications");
      }
    };

    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync().catch(() => null);
      if (last) handle(last);
      sub = Notifications.addNotificationResponseReceivedListener(handle);
    })();

    return () => {
      try { sub?.remove(); } catch { }
    };
  }, [role]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      try { DeviceEventEmitter.emit("asimos:pushReceived"); } catch { }
    });
    return () => {
      try { sub?.remove(); } catch { }
    };
  }, []);

  if (booting) {
    return <LaunchSplashScreen onDone={() => { }} minMs={1200} />;
  }

  if (showSplash) {
    return <LaunchSplashScreen onDone={() => setShowSplash(false)} minMs={850} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Guest mode */}
        {!isAuthed ? (
          <>
            <Stack.Screen name="SeekerTabs" component={SeekerTabs} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="AuthEntry" component={AuthEntryScreen} options={{ presentation: "modal" }} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} options={{ presentation: "modal" }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ presentation: "modal" }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ presentation: "card" }} />
            <Stack.Screen name="JobMap" component={JobMapScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
          </>
        ) : role === "employer" ? (
          <>
            {needsLocation ? (
              <Stack.Screen name="LocationAuto" component={LocationAutoScreen} />
            ) : (
              <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
            )}
            <Stack.Screen name="EmployerCreateJob" component={EmployerCreateJobScreen} />
            <Stack.Screen name="EmployerNotifications" component={EmployerNotificationsScreen} />
            <Stack.Screen name="EmployerMap" component={EmployerMapScreen} />

            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="JobMap" component={JobMapScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
          </>
        ) : (
          <>
            {/* Seeker */}
            {needsLocation ? (
              <Stack.Screen name="LocationAuto" component={LocationAutoScreen} />
            ) : (
              <Stack.Screen name="SeekerTabs" component={SeekerTabs} />
            )}
            <Stack.Screen name="JobDetail" component={JobDetailScreen} />
            <Stack.Screen name="SeekerNotifications" component={SeekerNotificationsScreen} />
            <Stack.Screen name="JobAlerts" component={JobAlertsScreen} options={{ title: "İş Bildirişləri", headerShown: true }} />
            <Stack.Screen name="CreateJobAlert" component={CreateJobAlertScreen} options={{ title: "Bildiriş Yarat", headerShown: true }} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="SeekerMap" component={SeekerMapScreen} options={{ presentation: "fullScreenModal", animation: "fade_from_bottom" }} />
            <Stack.Screen name="JobMap" component={JobMapScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
