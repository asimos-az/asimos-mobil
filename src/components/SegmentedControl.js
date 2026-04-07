import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export function SegmentedControl({ options, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {options?.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    width: "100%",
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  textActive: { color: Colors.primary, fontWeight: "800" },
});
