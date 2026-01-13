import React, { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";
import { SegmentedControl } from "../../components/SegmentedControl";
import { useNavigation } from "@react-navigation/native";

const RADIUS_PRESETS = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "1.2km", value: 1200 },
  { label: "2km", value: 2000 },
];

export function SeekerJobsListScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(1200);
  const [location, setLocation] = useState({ lat: 40.4093, lng: 49.8671, address: "Bakı (demo lokasiya)" });
  const [mapOpen, setMapOpen] = useState(false);

  const radiusOptions = useMemo(() => RADIUS_PRESETS.map(x => ({ label: x.label, value: x.value })), []);

  async function search() {
    try {
      setLoading(true);
      const data = await api.listJobsWithSearch({
        q,
        lat: location?.lat,
        lng: location?.lng,
        radius_m: radius,
        daily: undefined,
      });
      setItems(data);
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
        <View>
          <Text style={styles.title}>Axtarış</Text>
          <Text style={styles.sub}>Elanlar listi</Text>
        </View>
        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıxış</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Card style={{ marginBottom: 12 }}>
          <Input
            label="Axtarış (məs: ofisiant)"
            value={q}
            onChangeText={setQ}
            placeholder="Açar söz yaz..."
          />

          <Text style={styles.label}>Məsafə</Text>
          <SegmentedControl options={radiusOptions} value={radius} onChange={setRadius} style={{ marginBottom: 12 }} />
          <Text style={styles.help}>1km 200m üçün “1.2km” seç.</Text>

          <Text style={styles.label}>Sənin lokasiyan</Text>
          <PrimaryButton
            variant="secondary"
            title={location?.address ? location.address : "Xəritədən seç"}
            onPress={() => setMapOpen(true)}
          />
          <Text style={styles.help}>Axtarış radiusu bu lokasiyaya görə hesablanır.</Text>

          <View style={{ height: 12 }} />
          <PrimaryButton title="Axtar" loading={loading} onPress={search} />
        </Card>

        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={search}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Axtarış et və nəticələr burada görünsün.</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("JobDetail", { job: item })}>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  {item.isDaily ? <Text style={styles.badge}>Gündəlik</Text> : null}
                </View>
                {item.category ? <Text style={styles.meta}>Kateqoriya: {item.category}</Text> : null}
                <Text style={styles.meta}>{item.wage || "—"}</Text>
                {typeof item.distanceM === "number" ? <Text style={styles.meta}>Məsafə: {item.distanceM} m</Text> : null}
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
              </Card>
            </Pressable>
          )}
        />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 4, color: Colors.muted, fontWeight: "800" },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.primarySoft },
  logoutText: { color: Colors.primary, fontWeight: "900" },

  body: { flex: 1, padding: 16 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  help: { marginTop: 6, color: Colors.muted, fontSize: 12, fontWeight: "700" },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: { backgroundColor: Colors.primarySoft, color: Colors.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, fontWeight: "900" },

  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  meta: { marginTop: 6, color: Colors.muted, fontWeight: "800" },
  desc: { marginTop: 8, color: Colors.text, lineHeight: 20 },
});
