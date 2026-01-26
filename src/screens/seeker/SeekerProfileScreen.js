import React, { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";
import { registerForPushNotificationsAsync } from "../../utils/pushNotifications";
import { api } from "../../api/client";

export function SeekerProfileScreen() {
  const { user, signOut, updateLocation } = useAuth();
  const [locLoading, setLocLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await AsyncStorage.getItem("ASIMOS_NOTIF_ENABLED_V1").catch(() => null);
      if (!mounted) return;
      setNotifEnabled(v === "1");
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  async function toggleNotifications(next) {
    if (notifBusy) return;
    setNotifBusy(true);

    try {
      if (next) {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          Alert.alert(
            "Bildirişlər",
            "Bildiriş icazəsi verilmədi. Telefonun Settings bölməsindən bildirişləri aktiv et.",
            [
              { text: "Bağla", style: "cancel" },
              { text: "Settings aç", onPress: () => Linking.openSettings?.() },
            ]
          );
          await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "0").catch(() => {});
          setNotifEnabled(false);
          return;
        }

        await api.setPushToken(token);
        await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "1").catch(() => {});
        await AsyncStorage.setItem("ASIMOS_EXPO_PUSH_TOKEN_V1", token).catch(() => {});
        setNotifEnabled(true);
        Alert.alert("OK", "Bildirişlər aktiv edildi");
        return;
      }

      // disable
      try {
        await api.clearPushToken();
      } catch {
        // ignore
      }
      await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "0").catch(() => {});
      await AsyncStorage.removeItem("ASIMOS_EXPO_PUSH_TOKEN_V1").catch(() => {});
      setNotifEnabled(false);
      Alert.alert("OK", "Bildirişlər söndürüldü");
    } catch (e) {
      Alert.alert("Xəta", e.message || "Bildiriş ayarı dəyişmədi");
    } finally {
      setNotifBusy(false);
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
          <Text style={styles.item}>Email: {user?.email || "—"}</Text>
          <Text style={styles.item}>Telefon: {user?.phone || "—"}</Text>
          {user?.location?.address ? <Text style={styles.item}>📍 {user.location.address}</Text> : null}

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Bildirişlər</Text>
              <Text style={styles.rowSub}>
                Yaxınlıqda yeni vakansiya çıxanda push bildiriş gəlsin.
              </Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={(v) => toggleNotifications(v)}
              disabled={notifBusy}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={notifEnabled ? "#fff" : "#fff"}
            />
          </View>

          <View style={{ height: 14 }} />
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
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowTitle: { fontWeight: "900", color: Colors.text },
  rowSub: { marginTop: 4, color: Colors.muted, fontWeight: "700", fontSize: 12 },
});
