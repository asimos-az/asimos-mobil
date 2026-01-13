import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { Colors } from "../theme/colors";
import { SeekerJobsListScreen } from "../screens/seeker/SeekerJobsListScreen";
import { SeekerDailyJobsScreen } from "../screens/seeker/SeekerDailyJobsScreen";
import { SeekerProfileScreen } from "../screens/seeker/SeekerProfileScreen";

const Tab = createBottomTabNavigator();

export function SeekerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
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
    height: 66,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
});
