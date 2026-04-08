import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { SeekerJobsListScreen } from "../screens/seeker/SeekerJobsListScreen";
import { SeekerDailyJobsScreen } from "../screens/seeker/SeekerDailyJobsScreen";
import { SeekerProfileScreen } from "../screens/seeker/SeekerProfileScreen";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { NotificationBell } from "../components/NotificationBell";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

function SeekerHeaderRight() {
  const navigation = useNavigation();
  const [unread, setUnread] = React.useState(0);
  const prevCount = React.useRef(0);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.getUnreadNotificationsCount();
        const current = res?.unread || 0;
        if (current > prevCount.current) {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Yeni bildiriş", body: "Sizin üçün yeni bildiriş var.", sound: true },
            trigger: null,
          });
        }
        prevCount.current = current;
        setUnread(current);
      } catch {}
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ marginRight: 16 }}>
      <NotificationBell count={unread} onPress={() => navigation.navigate("SeekerProfile")} />
    </View>
  );
}

const tabs = {
  SeekerJobs: { icon: "search-outline", iconActive: "search", label: "Jobs" },
  SeekerDaily: { icon: "calendar-outline", iconActive: "calendar", label: "Daily" },
  SeekerProfile: { icon: "person-outline", iconActive: "person", label: "Profile" },
};

function SeekerTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || (Platform.OS === "android" ? 12 : 0);
  const bottomOffset = Math.max(safeBottom, 10);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}> 
      <View style={styles.tabBar}>
        {state.routes.map((route) => {
          const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
          const conf = tabs[route.name] || tabs.SeekerJobs;
          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.item, isFocused && styles.itemActive]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel || conf.label}
              hitSlop={10}
            >
              <Ionicons
                name={isFocused ? conf.iconActive : conf.icon}
                size={22}
                color={isFocused ? "#FFFFFF" : "#8E8E93"}
              />
              {isFocused ? <Text style={styles.itemText}>{conf.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SeekerTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: true,
        headerTitle: "Asimos",
        headerTitleStyle: { fontSize: 24, fontWeight: "900", color: Colors.text },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff" },
        tabBarShowLabel: false,
        headerRight: () => <SeekerHeaderRight />,
      }}
      tabBar={(props) => <SeekerTabBar {...props} />}
    >
      <Tab.Screen 
        name="SeekerJobs" 
        component={SeekerJobsListScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="SeekerDaily" 
        component={SeekerDailyJobsScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="SeekerProfile"
        component={SeekerProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              navigation.navigate("AuthEntry");
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  tabBar: {
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  item: {
    minWidth: 46,
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  itemActive: {
    backgroundColor: "#121212",
    minWidth: 96,
  },
  itemText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
