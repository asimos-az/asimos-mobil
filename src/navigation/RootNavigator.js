import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { AuthEntryScreen } from "../screens/auth/AuthEntryScreen";
import { EmployerTabs } from "./EmployerTabs";
import { SeekerTabs } from "./SeekerTabs";
import { EmployerCreateJobScreen } from "../screens/employer/EmployerCreateJobScreen";
import { JobDetailScreen } from "../screens/shared/JobDetailScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { booting, user } = useAuth();
  if (booting) return null;

  const isAuthed = !!user;
  const role = user?.role;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthed ? (
          <Stack.Screen name="AuthEntry" component={AuthEntryScreen} />
        ) : role === "employer" ? (
          <>
            <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
            <Stack.Screen name="EmployerCreateJob" component={EmployerCreateJobScreen} />
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
