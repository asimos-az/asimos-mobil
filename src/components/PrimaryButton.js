import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Colors } from "../theme/colors";

export function PrimaryButton({ title, onPress, loading=false, variant="primary" }) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && { opacity: 0.85 },
        loading && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={[styles.text, !isPrimary && styles.textSecondary]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  text: { color: "#fff", fontWeight: "900" },
  textSecondary: { color: Colors.text },
});
