import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { SelectField } from "../../components/SelectField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";
import { SegmentedControl } from "../../components/SegmentedControl";

const MS_DAY = 24 * 60 * 60 * 1000;

export function EmployerCreateJobScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [wage, setWage] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");

  // Job type (required)
  const [jobType, setJobType] = useState(null); // "permanent" | "temporary"
  const [durationPreset, setDurationPreset] = useState("1"); // "1" | "3" | "10" | "other"
  const [durationOther, setDurationOther] = useState("");

  const categoryOptions = [
    "Restoran",
    "Kafe",
    "Market",
    "Kuryer",
    "Taksi",
    "Ofis",
    "Tikinti",
    "Təhlükəsizlik",
    "Gözəllik",
    "Parkofka",
  ];

  const [location, setLocation] = useState(user.location || null);
  const [notifyRadiusM, setNotifyRadiusM] = useState("500");
  const [mapOpen, setMapOpen] = useState(false);

  const durationDays = useMemo(() => {
    if (jobType !== "temporary") return null;
    if (durationPreset === "other") {
      const n = parseInt(String(durationOther || "").trim(), 10);
      return Number.isFinite(n) ? n : null;
    }
    return parseInt(durationPreset, 10);
  }, [jobType, durationPreset, durationOther]);

  const expiryHint = useMemo(() => {
    const now = Date.now();
    if (!jobType) return null;
    if (jobType === "permanent") {
      const d = new Date(now + 28 * MS_DAY);
      return `Bu elan 28 gün sonra (${d.toLocaleDateString("az-AZ")}) avtomatik silinəcək.`;
    }
    if (!durationDays) return null;
    const d = new Date(now + durationDays * MS_DAY);
    return `Bu elan ${durationDays} gün üçün aktiv olacaq və ${d.toLocaleDateString("az-AZ")} tarixində avtomatik silinəcək.`;
  }, [jobType, durationDays]);

  async function submit() {
    try {
      setLoading(true);

      if (!title || !description) {
        Alert.alert("Xəta", "Elanın adı və təsvir vacibdir.");
        return;
      }
      if (!jobType) {
        Alert.alert("Xəta", "İş növünü seç (Daimi / Müvəqqəti).");
        return;
      }
      if (jobType === "temporary") {
        if (!durationDays || durationDays < 1 || durationDays > 365) {
          Alert.alert("Xəta", "Müvəqqəti iş üçün gün sayını seç (1/3/10 və ya digər).");
          return;
        }
      }
      if (!location) {
        Alert.alert("Xəta", "Lokasiya seç.");
        return;
      }

      await api.createJob({
        title,
        wage,
        category,
        whatsapp,
        description,

        // Backward compatibility (older server fields)
        isDaily: jobType === "temporary",

        // New fields for auto-expire
        jobType,
        durationDays: jobType === "temporary" ? durationDays : null,

        notifyRadiusM: notifyRadiusM ? Number(notifyRadiusM) : null,
        createdBy: user.id,
        location,
      });

      Alert.alert("OK", "Elan yaradıldı.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={location}
        onClose={() => setMapOpen(false)}
        onPicked={(loc) => setLocation(loc)}
      />

      <View style={styles.top}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Geri qayıt"
        >
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>

        <Text style={styles.title}>Elan yarat</Text>

        {/* right-side spacer so title stays visually centered */}
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Input
            label="Elanın adı"
            value={title}
            onChangeText={setTitle}
            placeholder="Məs: Ofisiant"
            autoCapitalize="words"
          />

          <View style={{ height: 10 }} />

          <Text style={styles.label}>İş növü *</Text>
          <SegmentedControl
            value={jobType}
            onChange={setJobType}
            options={[
              { label: "Daimi iş", value: "permanent" },
              { label: "Müvəqqəti iş", value: "temporary" },
            ]}
          />

          {jobType === "temporary" ? (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Müddət (gün) *</Text>
              <SegmentedControl
                value={durationPreset}
                onChange={setDurationPreset}
                options={[
                  { label: "1", value: "1" },
                  { label: "3", value: "3" },
                  { label: "10", value: "10" },
                  { label: "Digər", value: "other" },
                ]}
              />
              {durationPreset === "other" ? (
                <View style={{ marginTop: 10 }}>
                  <Input
                    label="Gün sayı"
                    value={durationOther}
                    onChangeText={setDurationOther}
                    placeholder="Məs: 7"
                    keyboardType="numeric"
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {expiryHint ? <Text style={styles.help}>{expiryHint}</Text> : null}

          <View style={{ height: 10 }} />

          <Input label="Maaş" value={wage} onChangeText={setWage} placeholder="Məs: 800 AZN" />

          <SelectField
            label="Kateqoriya"
            value={category}
            onChange={(v) => setCategory(String(v || ""))}
            placeholder="Kateqoriya seç"
            options={categoryOptions}
          />

          <Input
            label="WhatsApp nömrəsi"
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="+994..."
            keyboardType="phone-pad"
          />

          <Input
            label="Təsvir"
            value={description}
            onChangeText={setDescription}
            placeholder="Detalları yaz..."
            multiline
            numberOfLines={6}
            autoCapitalize="sentences"
          />

          <View style={{ height: 10 }} />

          <Text style={styles.label}>Lokasiya</Text>
          <PrimaryButton
            variant="secondary"
            title={location?.address ? location.address : "Xəritədən seç"}
            onPress={() => setMapOpen(true)}
          />
          <Text style={styles.help}>Xəritədə axtarış edib lokasiyanı seç.</Text>

          <View style={{ height: 10 }} />

          <Input
            label="Bildiriş radiusu (metr)"
            value={notifyRadiusM}
            onChangeText={setNotifyRadiusM}
            placeholder="Məs: 500"
            keyboardType="numeric"
          />
          <Text style={styles.help}>Bu radiusda (metr) olan bütün iş axtaranlara push bildiriş gedəcək.</Text>

          <View style={{ height: 14 }} />
          <PrimaryButton title="Yarat" loading={loading} onPress={submit} />
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text, flex: 1, textAlign: "center" },
  scroll: { padding: 16, paddingBottom: 24 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  help: { marginTop: 8, color: Colors.muted, fontSize: 12, fontWeight: "700" },
});
