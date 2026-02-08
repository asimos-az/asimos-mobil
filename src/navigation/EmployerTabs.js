import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../theme/colors";
import { EmployerJobsScreen } from "../screens/employer/EmployerJobsScreen";
import { EmployerProfileScreen } from "../screens/employer/EmployerProfileScreen";

const Tab = createBottomTabNavigator();

function iconFor(routeName, focused) {
  if (routeName === "EmployerJobs") return focused ? "list" : "list-outline";
  if (routeName === "EmployerProfile") return focused ? "person" : "person-outline";
  return "ellipse";
}

function EmployerTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || (Platform.OS === "android" ? 16 : 0);
  const focusedName = state.routes[state.index]?.name;

  function goTo(routeName) {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;

    const isFocused = route.name === focusedName;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  function goCreateJob() {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerCreateJob");
    else navigation.navigate("EmployerCreateJob");
  }

  const jobsFocused = focusedName === "EmployerJobs";
  const profileFocused = focusedName === "EmployerProfile";

  const bottomOffset = Math.max(safeBottom, 10);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.tabBar}>
        <View style={styles.leftGroup}>
          <Pressable
            onPress={() => goTo("EmployerJobs")}
            style={styles.iconHit}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Elanlar"
          >
            <Ionicons
              name={iconFor("EmployerJobs", jobsFocused)}
              size={24}
              color={jobsFocused ? Colors.primary : Colors.muted}
            />
          </Pressable>
        </View>

        {/* keep a gap so the floating plus doesn't overlap icons */}
        <View style={{ width: 76 }} />

        <View style={styles.rightGroup}>
          <Pressable
            onPress={() => goTo("EmployerProfile")}
            style={styles.iconHit}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Profil"
          >
            <Ionicons
              name={iconFor("EmployerProfile", profileFocused)}
              size={24}
              color={profileFocused ? Colors.primary : Colors.muted}
            />
          </Pressable>
        </View>

        <View pointerEvents="box-none" style={styles.centerWrap}>
          <Pressable
            onPress={goCreateJob}
            style={styles.centerBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Vakansiya yarat"
          >
            <Ionicons name="add" size={30} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <EmployerTabBar {...props} />}
    >
      <Tab.Screen name="EmployerJobs" component={EmployerJobsScreen} />
      <Tab.Screen name="EmployerProfile" component={EmployerProfileScreen} />
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
    height: 62,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  leftGroup: { flexDirection: "row", alignItems: "center", gap: 24 },
  rightGroup: { flexDirection: "row", alignItems: "center" },
  iconHit: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -24,
    alignItems: "center",
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
});
