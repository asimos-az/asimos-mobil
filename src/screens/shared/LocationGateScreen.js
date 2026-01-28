import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";
import { useAuth } from "../../context/AuthContext";

export function LocationGateScreen() {
  const { user, updateLocation } = useAuth();
  const [mapOpen, setMapOpen] = useState(true);
  const [loc, setLoc] = useState(user?.location || null);
  const [saving, setSaving] = useState(false);

  async function save() {
    try {
      if (!loc) {
        Alert.alert("Xəta", "Lokasiya seçilməyib.");
        return;
      }
      setSaving(true);
      await updateLocation(loc);
    } catch (e) {
      Alert.alert("Xəta", e.message || "Xəta oldu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={loc}
        userLocation={user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={(picked) => setLoc(picked)}
      />

      <View style={styles.wrap}>
        <Card>
          <Text style={styles.title}>Lokasiya aktiv et</Text>
          <Text style={styles.sub}>
            Davam etmək üçün lokasiya seçmək məcburidir.
            {user?.role === "seeker" ? " Axtarış filteri buna görə işləyəcək." : ""}
          </Text>

          <View style={{ height: 12 }} />

          <PrimaryButton
            variant="secondary"
            title={loc?.address ? loc.address : "Xəritədən lokasiya seç"}
            onPress={() => setMapOpen(true)}
          />

          <View style={{ height: 12 }} />

          <PrimaryButton title="Təsdiqlə" loading={saving} onPress={save} />
          <Text style={styles.hint}>Xəritədə axtarış edib toxunaraq marker seç.</Text>
        </Card>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 8, color: Colors.muted, fontWeight: "800", lineHeight: 18 },
  hint: { marginTop: 10, color: Colors.muted, fontWeight: "700", fontSize: 12 },
});
