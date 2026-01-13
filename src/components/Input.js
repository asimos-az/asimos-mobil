import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Colors } from "../theme/colors";

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize="none",
  multiline=false,
  numberOfLines=1
}) {
  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 12 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});
