import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";

function normalizeOptions(options) {
  return (options || []).map((o) => {
    if (typeof o === "string") return { label: o, value: o };
    return { label: String(o?.label ?? o?.value ?? ""), value: o?.value ?? o?.label };
  }).filter((x) => x.label);
}

/**
 * Simple select (modal list)
 * - No extra deps
 * - Looks like an input
 */
export function SelectField({
  label,
  value,
  onChange,
  placeholder = "Seç",
  options = [],
  loading = false,
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const opts = useMemo(() => normalizeOptions(options), [options]);

  const currentLabel = useMemo(() => {
    const hit = opts.find((o) => String(o.value) === String(value));
    return hit ? hit.label : (value ? String(value) : "");
  }, [opts, value]);

  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={() => {
          if (!loading) setOpen(true);
        }}
        disabled={loading}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label} seç` : "Seç"}
      >
        <Text style={[styles.value, (!currentLabel || loading) && styles.placeholder]} numberOfLines={1}>
          {loading ? "Yüklənir..." : (currentLabel || placeholder)}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || "Seç"}</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.iconBtn}>
                <Ionicons name="close" size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {opts.map((o) => {
                const active = String(o.value) === String(value);
                return (
                  <Pressable
                    key={String(o.value)}
                    onPress={() => {
                      onChange?.(o.value);
                      setOpen(false);
                    }}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{o.label}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={Colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 12 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "700" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: { color: Colors.text, fontWeight: "800", flex: 1 },
  placeholder: { color: "#94A3B8", fontWeight: "800" },

  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: Colors.text },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  optionActive: { backgroundColor: Colors.primarySoft },
  optionText: { color: Colors.text, fontWeight: "700", fontSize: 16 },
  optionTextActive: { color: Colors.primary, fontWeight: "900" },
});
