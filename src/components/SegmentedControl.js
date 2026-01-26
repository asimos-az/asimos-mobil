import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export function SegmentedControl({ options, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
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
    gap: 10,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  item: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  itemActive: {
    borderBottomColor: Colors.primary,
  },
  text: { color: Colors.muted, fontWeight: "900" },
  textActive: { color: Colors.text },
});
