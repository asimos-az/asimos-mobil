import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { SeekerJobsListScreen } from "../screens/seeker/SeekerJobsListScreen";
import { SeekerDailyJobsScreen } from "../screens/seeker/SeekerDailyJobsScreen";
import { SeekerMapScreen } from "../screens/seeker/SeekerMapScreen";
import { SeekerProfileScreen } from "../screens/seeker/SeekerProfileScreen";

const Tab = createBottomTabNavigator();

export function SeekerTabs() {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom || (Platform.OS === "android" ? 16 : 0);
  const bottomOffset = Math.max(safeBottom, 10);
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            bottom: bottomOffset,
          },
        ],
      }}
    >
      <Tab.Screen
        name="SeekerJobs"
        component={SeekerJobsListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={24}
              color={focused ? Colors.primary : Colors.muted}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SeekerDaily"
        component={SeekerDailyJobsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
              color={focused ? Colors.primary : Colors.muted}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SeekerMap"
        component={SeekerMapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
              size={24}
              color={focused ? Colors.primary : Colors.muted}
            />
          ),
        }}
      />

      <Tab.Screen
        name="SeekerProfile"
        component={SeekerProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={focused ? Colors.primary : Colors.muted}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 62,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    // Android shadow
    elevation: 10,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },

  },
});
