import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";
import { BackgroundDecor } from "../../components/BackgroundDecor";
import { Colors } from "../../theme/colors";

/**
 * App launch splash (JS-level).
 * Shows background + animated logo in center.
 */
export function LaunchSplashScreen({ onDone, minMs = 900 }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDone?.());
    }, minMs);

    return () => clearTimeout(t);
  }, [minMs, onDone]);

  return (
    <View style={styles.root}>
      <BackgroundDecor />
      <Animated.View style={[styles.center, { opacity }]}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../../assets/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Asimos logo"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1 },
  logoWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 24,
  },
});
