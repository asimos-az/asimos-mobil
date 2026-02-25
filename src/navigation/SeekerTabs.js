import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { SeekerJobsListScreen } from "../screens/seeker/SeekerJobsListScreen";
import { SeekerDailyJobsScreen } from "../screens/seeker/SeekerDailyJobsScreen";
import { SeekerMapScreen } from "../screens/seeker/SeekerMapScreen";
import { SeekerProfileScreen } from "../screens/seeker/SeekerProfileScreen";
import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();

export function SeekerTabs() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const safeBottom = insets.bottom || (Platform.OS === "android" ? 16 : 0);
  const bottomOffset = Math.max(safeBottom, 10);
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: true,
        headerTitle: "Asimos",
        headerTitleStyle: { fontSize: 22, fontWeight: "900", color: Colors.primary },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
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
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={22}
                color={focused ? "#fff" : Colors.muted}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="SeekerDaily"
        component={SeekerDailyJobsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={22}
                color={focused ? "#fff" : Colors.muted}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="SeekerMap"
        component={SeekerMapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? "map" : "map-outline"}
                size={22}
                color={focused ? "#fff" : Colors.muted}
              />
            </View>
          ),
        }}
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
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={focused ? "#fff" : Colors.muted}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 16, // Reduced radius
    backgroundColor: "#fff",
    borderTopWidth: 0,
    paddingTop: 0,
    paddingBottom: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    flexDirection: 'row', // Ensure row
    alignItems: 'center', // Vertical center
    justifyContent: 'space-around', // Distribute items
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
});
