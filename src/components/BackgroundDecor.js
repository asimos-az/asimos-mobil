import React from "react";
import { StyleSheet, View } from "react-native";
import { Colors } from "../theme/colors";

/** Subtle background bubbles in MyGov-like style */
export function BackgroundDecor() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={[styles.bubble, styles.b1]} />
      <View style={[styles.bubble, styles.b2]} />
      <View style={[styles.bubble, styles.b3]} />
      <View style={[styles.bubble, styles.b4]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject },
  bubble: {
    position: "absolute",
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.border,
    borderWidth: 1,
    opacity: 0.7,
  },
  b1: { width: 220, height: 220, borderRadius: 110, top: -60, left: -60 },
  b2: { width: 160, height: 160, borderRadius: 80, top: 80, right: -70, opacity: 0.55 },
  b3: { width: 260, height: 260, borderRadius: 130, bottom: -110, right: -90, opacity: 0.55 },
  b4: { width: 120, height: 120, borderRadius: 60, bottom: 120, left: -40, opacity: 0.45 },
});
