import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";

export function EmployerProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, updateLocation } = useAuth();
  const [locLoading, setLocLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  function goCreateJob() {
    // Tab içindən Root Stack-dəki screen-ə keçmək üçün parent-ə yönləndir.
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerCreateJob");
    else navigation.navigate("EmployerCreateJob");
  }

  async function onPickedLocation(loc) {
    if (locLoading) return;
    setLocLoading(true);
    try {
      await updateLocation(loc);
      Alert.alert("OK", "Lokasiya yeniləndi");
    } catch (e) {
      Alert.alert("Xəta", e.message || "Lokasiya yenilənmədi");
    } finally {
      setLocLoading(false);
    }
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={onPickedLocation}
      />

      <View style={styles.top}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.body}>
        <Card>
          <Text style={styles.name}>{user?.fullName || "—"}</Text>
          <Text style={styles.item}>Şirkət: {user?.companyName || "—"}</Text>
          <Text style={styles.item}>Email: {user?.email || "—"}</Text>
          <Text style={styles.item}>Telefon: {user?.phone || "—"}</Text>
          {user?.location?.address ? <Text style={styles.item}>📍 {user.location.address}</Text> : null}

          <View style={{ height: 14 }} />
          <PrimaryButton title="Vakansiya yarat" onPress={goCreateJob} />
          <View style={{ height: 10 }} />
          <PrimaryButton title="Lokasiyanı yenilə" loading={locLoading} onPress={() => setMapOpen(true)} />
          <View style={{ height: 10 }} />
          <PrimaryButton variant="secondary" title="Çıxış" onPress={signOut} />
        </Card>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  body: { flex: 1, padding: 16 },
  name: { fontSize: 18, fontWeight: "900", color: Colors.text, marginBottom: 10 },
  item: { color: Colors.muted, fontWeight: "800", marginBottom: 6 },
});
