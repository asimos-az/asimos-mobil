import 'react-native-gesture-handler';
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AlertProvider } from "./src/context/AlertContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <AlertProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AlertProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
