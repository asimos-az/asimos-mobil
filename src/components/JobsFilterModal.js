import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Card } from "./Card";
import { Colors } from "../theme/colors";
import { SelectField } from "./SelectField";

function Chip({ label, active, onPress, onRemove }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive, onRemove && { paddingRight: 8 }]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={{ marginLeft: 6 }}>
          <Ionicons name="close-circle" size={16} color={Colors.muted} />
        </Pressable>
      )}
    </Pressable>
  );
}

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
  radiusOptions, // NO LONGER USED
  categories,
  selectedCategories,
  toggleCategory,
  jobType,
  setJobType,
  baseLocation,
  onPickLocation,
  onReset,
  onApply,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const hasCats = (categories || []).length > 0;
  
  const [keywordInput, setKeywordInput] = useState("");
  const keywordTags = useMemo(() => {
    if (!q || !q.trim()) return [];
    return q.split(" ").filter(Boolean);
  }, [q]);

  const handleAddKeyword = () => {
    const val = keywordInput.trim();
    if (val && !keywordTags.includes(val)) {
      const newQuery = [...keywordTags, val].join(" ");
      setQ(newQuery);
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kw) => {
    const newQuery = keywordTags.filter(k => k !== kw).join(" ");
    setQ(newQuery);
  };

  const locLabel = useMemo(() => {
    return baseLocation?.address ? baseLocation.address : "Məkan təyin edilmədi - Xəritədən seç";
  }, [baseLocation?.address]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: 10 + insets.bottom }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 18 + insets.bottom, paddingHorizontal: 4 }} showsVerticalScrollIndicator={false}>
            
            <View style={styles.section}>
              <Text style={styles.label}>Açar sözlər (Vakansiya adı)</Text>
              <View style={styles.inputRow}>
                  <TextInput
                      style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}
                      value={keywordInput}
                      onChangeText={setKeywordInput}
                      onSubmitEditing={handleAddKeyword}
                      placeholder="Məs: ofisiant (yaz və '+' bas)"
                      placeholderTextColor={Colors.muted}
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddKeyword}>
                      <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
              </View>
              {keywordTags.length > 0 && (
                <View style={styles.chipWrap}>
                  {keywordTags.map(kw => (
                    <Chip key={kw} label={kw} onRemove={() => handleRemoveKeyword(kw)} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Maaş (filter)</Text>
              <View style={styles.two}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Min</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={minWage}
                    onChangeText={setMinWage}
                    placeholder="məs: 400"
                    placeholderTextColor={Colors.muted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Max</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={maxWage}
                    onChangeText={setMaxWage}
                    placeholder="məs: 1200"
                    placeholderTextColor={Colors.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {setJobType && (
              <View style={styles.section}>
                <Text style={styles.label}>İş Rejimi</Text>
                <View style={styles.distRow}>
                  {["all", "permanent", "temporary"].map(t => {
                    const isActive = (jobType || "all") === t;
                    const label = t === "all" ? "Fərqi yoxdur" : t === "permanent" ? "Daimi" : "Müvəqqəti";
                    return (
                        <TouchableOpacity 
                            key={t}
                            style={[styles.distBtn, isActive && styles.distBtnActive]} 
                            onPress={() => setJobType(t === "all" ? null : t)}
                        >
                            <Text style={[styles.distText, isActive && styles.distTextActive]}>{label}</Text>
                            {isActive && <View style={styles.distLine} />}
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <Text style={[styles.label, {marginBottom: 0}]}>Məsafə</Text>
                <Text style={styles.subLabel}>
                  {radius > 0 
                    ? (radius >= 1000 
                        ? (Number.isInteger(radius/1000) ? `${radius/1000} km` : `${(radius/1000).toFixed(1)} km`) 
                        : `${radius} m`) 
                    : "Ölkə üzrə"}
                </Text>
              </View>
              <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={50000}
                  step={1000}
                  value={radius || 0}
                  onValueChange={setRadius}
                  minimumTrackTintColor={Colors.text}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.text}
              />
            </View>

            {hasCats ? (
              <View style={styles.section}>
                <SelectField
                  label="Kateqoriya"
                  options={categories}
                  value={selectedCategories?.[0] || ""}
                  onChange={(val) => {
                    // Because toggle flips the value, if it's currently selected, it removes it. If not, it adds it.
                    // We only want ONE category realistically if it's a dropdown, so if we click another one, ideally it clears previous.
                    // But `toggleCategory` only toggles one string. 
                    // Let's just pass `val` to `toggleCategory`. If they pick a new one, it will add it. 
                    // Wait, we can modify parents later if needed.
                    toggleCategory(val);
                  }}
                  placeholder="İstənilən kateqoriya"
                />
                {(selectedCategories || []).length > 0 && (
                   <View style={styles.chipWrap}>
                      {selectedCategories.map(c => (
                         <Chip key={c} label={c} active onRemove={() => toggleCategory(c)} />
                      ))}
                   </View>
                )}
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.label}>Filter lokasiyası (Xəritədən seç)</Text>
              <TouchableOpacity style={styles.locBox} onPress={onPickLocation}>
                <Text style={styles.locBoxText}>{locLabel}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={onApply}>
                <Text style={styles.submitText}>Tətbiq et</Text>
            </TouchableOpacity>

            <Pressable onPress={onReset} style={{ marginTop: 16 }}>
              <Text style={styles.reset}>Filterləri sıfırla</Text>
            </Pressable>

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
    maxHeight: "92%",
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "900", color: Colors.text },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "800", color: Colors.text, marginBottom: 12 },
  subLabel: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 6 },
  
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
  inputBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  two: { flexDirection: "row", gap: 12 },

  distRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderColor: Colors.border },
  distBtn: { paddingVertical: 12, paddingHorizontal: 4, position: "relative" },
  distText: { fontSize: 14, fontWeight: "600", color: Colors.muted },
  distTextActive: { color: Colors.text, fontWeight: "800" },
  distLine: { position: "absolute", bottom: -1, left: 0, right: 0, height: 2, backgroundColor: Colors.text },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  chipActive: { backgroundColor: "rgba(16, 185, 129, 0.1)", borderColor: "#10B981" },
  chipText: { fontSize: 13, color: Colors.muted, fontWeight: "700" },
  chipTextActive: { color: "#065F46" },

  locBox: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    minHeight: 60,
    justifyContent: "center",
  },
  locBoxText: { fontSize: 14, fontWeight: "700", color: Colors.text, lineHeight: 22 },

  submitBtn: {
    backgroundColor: Colors.text,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  reset: { color: Colors.text, fontWeight: "900", textAlign: "center", opacity: 0.6 },
});
