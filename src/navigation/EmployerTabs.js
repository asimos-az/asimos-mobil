import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../theme/colors";
import { EmployerJobsScreen } from "../screens/employer/EmployerJobsScreen";
import { EmployerProfileScreen } from "../screens/employer/EmployerProfileScreen";

const Tab = createBottomTabNavigator();

const tabs = {
  EmployerJobs: { icon: "briefcase-outline", iconActive: "briefcase", label: "Jobs" },
  EmployerProfile: { icon: "person-outline", iconActive: "person", label: "Profile" },
};

function EmployerTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || (Platform.OS === "android" ? 12 : 0);
  const bottomOffset = Math.max(safeBottom, 10);
  const focusedName = state.routes[state.index]?.name;

  function goTo(routeName) {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const isFocused = route.name === focusedName;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  }

  function goCreateJob() {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerCreateJob");
    else navigation.navigate("EmployerCreateJob");
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route) => {
          const isFocused = route.name === focusedName;
          const conf = tabs[route.name] || tabs.EmployerJobs;
          return (
            <Pressable
              key={route.key}
              onPress={() => goTo(route.name)}
              style={[styles.item, isFocused && styles.itemActive]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel || conf.label}
              hitSlop={10}
            >
              <Ionicons name={isFocused ? conf.iconActive : conf.icon} size={22} color={isFocused ? "#FFFFFF" : "#8E8E93"} />
              {isFocused ? <Text style={styles.itemText}>{conf.label}</Text> : null}
            </Pressable>
          );
        })}

        <Pressable onPress={goCreateJob} style={styles.centerBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Vakansiya yarat">
          <Ionicons name="add" size={24} color="#111111" />
        </Pressable>
      </View>
    </View>
  );
}

export function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerTitle: "Asimos",
        headerTitleStyle: { fontSize: 22, fontWeight: "900", color: Colors.primary },
        tabBarShowLabel: false,
      }}
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
  centerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },
});
