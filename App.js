import 'react-native-gesture-handler';
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { ToastProvider } from "./src/context/ToastContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AlertProvider } from "./src/context/AlertContext";

import { AnimatedSplash } from "./src/components/AnimatedSplash";
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function App() {
  const [appReady, setAppReady] = React.useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = React.useState(false);

  React.useEffect(() => {
    // Simulate asset loading or other setup
    async function prepare() {
      try {
        // Load fonts, etc.
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        // Hide native splash, show our animated one
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) {
    return null; // or empty view, native splash handles this
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <AlertProvider>
            <StatusBar style="dark" />
            {!splashAnimationFinished && (
              <AnimatedSplash onFinish={() => setSplashAnimationFinished(true)} />
            )}
            <RootNavigator />
          </AlertProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
