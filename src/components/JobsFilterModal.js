import React, { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "./Card";
import { Input } from "./Input";
import { PrimaryButton } from "./PrimaryButton";
import { SegmentedControl } from "./SegmentedControl";
import { Colors } from "../theme/colors";

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Vakansiya filteri (modal)
 * - Axtarış (vakansiya adı)
 * - Maaş min/max
 * - Məsafə (radius)
 * - Kateqoriya (multi-select)
 * - Filter lokasiyası (optional)
 */
export function JobsFilterModal({
  visible,
  title = "Filtrlər",
  q,
  setQ,
  minWage,
  setMinWage,
  maxWage,
  setMaxWage,
  radius,
  setRadius,
  radiusOptions,
  categories,
  selectedCategories,
  toggleCategory,
  baseLocation,
  onPickLocation,
  onReset,
  onApply,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const hasCats = (categories || []).length > 0;

  const locLabel = useMemo(() => {
    return baseLocation?.address ? baseLocation.address : "Xəritədən seç";
  }, [baseLocation?.address]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: 10 + insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={Colors.muted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 18 + insets.bottom }} showsVerticalScrollIndicator={false}>
            <Card>
              <Input
                label="Axtarış (vakansiya adı)"
                value={q}
                onChangeText={setQ}
                placeholder="Məs: ofisiant"
              />

              <Text style={styles.label}>Maaş (filter)</Text>
              <View style={styles.two}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Min"
                    value={minWage}
                    onChangeText={setMinWage}
                    placeholder="məs: 400"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Max"
                    value={maxWage}
                    onChangeText={setMaxWage}
                    placeholder="məs: 1200"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Məsafə</Text>
              <SegmentedControl
                options={radiusOptions}
                value={radius}
                onChange={setRadius}
                style={{ marginBottom: 12 }}
              />

              {hasCats ? (
                <>
                  <Text style={styles.label}>Kateqoriya</Text>
                  <View style={styles.chipWrap}>
                    {(categories || []).map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={(selectedCategories || []).includes(c)}
                        onPress={() => toggleCategory(c)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              <Text style={styles.label}>Filter lokasiyası</Text>
              <PrimaryButton
                variant="secondary"
                title={locLabel}
                onPress={onPickLocation}
              />

              <View style={{ height: 12 }} />
              <PrimaryButton title="Tətbiq et" onPress={onApply} />

              <Pressable onPress={onReset} style={{ marginTop: 12 }}>
                <Text style={styles.reset}>Filterləri sıfırla</Text>
              </Pressable>
            </Card>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "88%",
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  two: { flexDirection: "row", gap: 10 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipText: { color: Colors.muted, fontWeight: "900" },
  chipTextActive: { color: Colors.primary },
  reset: { color: Colors.primary, fontWeight: "900", textAlign: "center" },
});
