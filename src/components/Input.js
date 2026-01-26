import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  numberOfLines=1,
  ...rest
}) {
  // Show/hide toggle for password inputs
  const [hidden, setHidden] = useState(!!secureTextEntry);

  useEffect(() => {
    setHidden(!!secureTextEntry);
  }, [secureTextEntry]);

  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry ? hidden : false}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...rest}
          style={[
            styles.input,
            multiline && styles.multiline,
            secureTextEntry && !multiline ? styles.withIcon : null,
          ]}
          placeholderTextColor="#94A3B8"
        />

        {secureTextEntry && !multiline ? (
          <Pressable
            onPress={() => setHidden((p) => !p)}
            hitSlop={10}
            style={styles.eye}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Şifrəni göstər" : "Şifrəni gizlət"}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={Colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 12 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "700" },
  wrap: { position: "relative" },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
  },
  withIcon: {
    paddingRight: 44,
  },
  eye: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 12,
  },
});
