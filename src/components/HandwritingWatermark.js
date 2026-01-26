import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

/**
 * Handwriting-like animated watermark.
 * "Reveal" animation: text is clipped from left to right (like writing).
 * Adjusted for better visibility on splash.
 */
export function HandwritingWatermark({ text = "Asimos", size = 64, opacity = 0.32 }) {
  // Make clip wide enough so the whole word doesn't get permanently cut
  const CLIP_WIDTH = 460;

  const clip = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(opacity * 0.55)).current;

  const fontFamily = useMemo(() => {
    // Script-like fonts on iOS; Android fallback to "cursive"
    if (Platform.OS === "ios") return "Snell Roundhand";
    return "cursive";
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(clip, {
            toValue: CLIP_WIDTH,
            duration: 2100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(fade, {
            toValue: opacity,
            duration: 850,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        Animated.delay(700),
        Animated.parallel([
          Animated.timing(clip, {
            toValue: 0,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(fade, {
            toValue: opacity * 0.55,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        Animated.delay(300),
      ])
    );

    anim.start();
    return () => anim.stop();
  }, [clip, fade, opacity]);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {/* subtle always-on text for readability */}
      <Text style={[styles.text, styles.base, { fontFamily, fontSize: size }]}>{text}</Text>

      {/* animated reveal (looks like handwriting) */}
      <Animated.View style={[styles.clip, { width: clip, opacity: fade }]}>
        <Text style={[styles.text, { fontFamily, fontSize: size }]}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  clip: {
    overflow: "hidden",
    transform: [{ rotate: "-6deg" }],
  },
  text: {
    color: Colors.primary,
    letterSpacing: -1,
    fontWeight: "700",
    textAlign: "center",
  },
  base: {
    position: "absolute",
    opacity: 0.14,
    transform: [{ rotate: "-6deg" }],
  },
});
