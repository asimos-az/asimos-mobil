import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

export function PrimaryButton({ title, onPress, loading=false, variant="primary", iconName }) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : isDanger ? styles.danger : isOutline ? styles.outline : styles.secondary,
        pressed && { opacity: 0.85 },
        loading && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.row}>
          {!!iconName && (
            <Ionicons
              name={iconName}
              size={18}
              color={isPrimary ? "#fff" : isDanger ? Colors.danger : Colors.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.text, !isPrimary && styles.textSecondary, isDanger && styles.textDanger]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: Colors.primary, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  outline: { backgroundColor: Colors.primarySoft, borderWidth: 1, borderColor: Colors.primary, },
  secondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  danger: { backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.danger },
  text: { color: "#fff", fontWeight: "900" },
  textSecondary: { color: Colors.text },
  textDanger: { color: Colors.danger },
});
