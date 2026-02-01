import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { getDeviceLocationOrNull } from "../../utils/deviceLocation";

export function LocationAutoScreen() {
  const { updateLocation } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | denied
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const loc = await getDeviceLocationOrNull({ timeoutMs: 12000 });
        if (!mounted) return;
        if (!loc) {
          setStatus("denied");
          return;
        }
        await updateLocation(loc);
        // RootNavigator will route to tabs automatically
      } catch {
        if (!mounted) return;
        setStatus("denied");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tries]);

  if (status === "loading") {
    return (
      <SafeScreen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.title}>Lokasiya aktiv edilir...</Text>
          <Text style={styles.sub}>Telefon lokasiya icazəsi soruşula bilər.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={styles.wrap}>
        <Card>
          <Text style={styles.title}>Lokasiya tapılmadı</Text>
          <Text style={styles.sub}>
            Sizə ən uyğun işləri və elanları göstərmək üçün lokasiya icazəsi və GPS aktiv olmalıdır.
          </Text>

          <View style={{ height: 14 }} />

          <Pressable
            style={styles.btn}
            onPress={() => {
              try { Linking.openSettings(); } catch { }
            }}
          >
            <Text style={styles.btnText}>Ayarları aç</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => {
              setStatus("loading");
              setTries((t) => t + 1);
            }}
          >
            <Text style={styles.btnTextSecondary}>Yenidən yoxla</Text>
          </Pressable>

          <View style={{ height: 8 }} />
          <Text style={styles.hint}>Android: GPS açıq olsun • iOS: Location Services açıq olsun</Text>
        </Card>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  wrap: { flex: 1, padding: 16, justifyContent: "center" },
  title: { marginTop: 12, fontSize: 18, fontWeight: "900", color: Colors.text, textAlign: "center" },
  sub: { marginTop: 10, color: Colors.muted, fontWeight: "800", lineHeight: 18, textAlign: "center" },
  btn: { marginTop: 12, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "900" },
  btnSecondary: { backgroundColor: Colors.primarySoft, borderWidth: 1, borderColor: Colors.border },
  btnTextSecondary: { color: Colors.primary, fontWeight: "900" },
  hint: { color: Colors.muted, fontWeight: "700", fontSize: 12, textAlign: "center" },
});
