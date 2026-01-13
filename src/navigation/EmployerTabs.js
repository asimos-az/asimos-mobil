import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { EmployerJobsScreen } from "../screens/employer/EmployerJobsScreen";
import { EmployerProfileScreen } from "../screens/employer/EmployerProfileScreen";
import { useNavigation } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

function DummyScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;
}

function CenterPlusButton() {
  const navigation = useNavigation();
  return (
    <Pressable onPress={() => navigation.navigate("EmployerCreateJob")} style={styles.centerBtn}>
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
  );
}

export function EmployerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="EmployerJobs"
        component={EmployerJobsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={24}
              color={focused ? Colors.primary : Colors.muted}
            />
          ),
        }}
      />

      <Tab.Screen
        name="EmployerCreateCenter"
        component={DummyScreen}
        options={{
          tabBarButton: () => (
            <View style={styles.centerWrap}>
              <CenterPlusButton />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="EmployerProfile"
        component={EmployerProfileScreen}
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
  centerWrap: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  centerBtn: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
});
