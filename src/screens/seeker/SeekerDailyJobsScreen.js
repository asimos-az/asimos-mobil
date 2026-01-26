import React, { useMemo, useRef, useState, useEffect } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { MapPicker } from "../../components/MapPicker";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { JobsFilterModal } from "../../components/JobsFilterModal";

const RADIUS_PRESETS = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "1.2km", value: 1200 },
  { label: "2km", value: 2000 },
];

function extractWageNumber(wageText) {
  if (!wageText) return null;
  const m = String(wageText).replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function SeekerDailyJobsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);

  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(1200);
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [mapOpen, setMapOpen] = useState(false);
  const [baseLocation, setBaseLocation] = useState(user?.location || null);

  const location = baseLocation || user?.location;
  const didInit = useRef(false);

  const radiusOptions = useMemo(() => RADIUS_PRESETS.map((x) => ({ label: x.label, value: x.value })), []);

  const categories = useMemo(() => {
    const set = new Set();
    (items || []).forEach((it) => {
      if (it?.category) set.add(String(it.category));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const minN = minWage ? Number(minWage) : null;
    const maxN = maxWage ? Number(maxWage) : null;

    return (items || []).filter((it) => {
      if (selectedCategories?.length) {
        if (!it?.category) return false;
        if (!selectedCategories.includes(String(it.category))) return false;
      }
      const w = extractWageNumber(it.wage);
      if (minN !== null && Number.isFinite(minN)) {
        if (w === null) return false;
        if (w < minN) return false;
      }
      if (maxN !== null && Number.isFinite(maxN)) {
        if (w === null) return false;
        if (w > maxN) return false;
      }
      return true;
    });
  }, [items, minWage, maxWage, selectedCategories]);

  async function loadList() {
    try {
      if (!location?.lat || !location?.lng) return;
      setLoading(true);
      const data = await api.listJobsWithSearch({
        q: q?.trim() || "",
        lat: location.lat,
        lng: location.lng,
        radius_m: radius,
        daily: true,
      });
      setItems(data);
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!baseLocation && user?.location) setBaseLocation(user.location);
  }, [user?.location?.lat, user?.location?.lng]);

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    if (didInit.current) return;
    didInit.current = true;
    loadList();
  }, [location?.lat, location?.lng]);

  const hasActiveFilters = !!(q?.trim() || minWage || maxWage || (selectedCategories?.length) || radius !== 1200);

  function toggleCategory(cat) {
    setSelectedCategories((prev) => {
      const s = new Set(prev || []);
      if (s.has(cat)) s.delete(cat); else s.add(cat);
      return Array.from(s);
    });
  }

  function resetFilters() {
    setQ("");
    setRadius(1200);
    setMinWage("");
    setMaxWage("");
    setSelectedCategories([]);
    setBaseLocation(user?.location || null);
  }

  return (
    <SafeScreen>
      <JobsFilterModal
        visible={filterOpen}
        title="Filtrlər"
        q={q}
        setQ={setQ}
        minWage={minWage}
        setMinWage={setMinWage}
        maxWage={maxWage}
        setMaxWage={setMaxWage}
        radius={radius}
        setRadius={setRadius}
        radiusOptions={radiusOptions}
        categories={categories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        baseLocation={location}
        onPickLocation={() => setMapOpen(true)}
        onReset={resetFilters}
        onApply={() => {
          setFilterOpen(false);
          loadList();
        }}
        onClose={() => setFilterOpen(false)}
      />

      <MapPicker
        visible={mapOpen}
        initial={location}
        onClose={() => setMapOpen(false)}
        onPicked={async (loc) => {
          setBaseLocation(loc);
          didInit.current = true;
          loadList();
        }}
      />

      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Gündəlik işlər</Text>
          <Text style={styles.sub}>Yalnız gündəlik elanlar</Text>
        </View>

        <Pressable onPress={() => setFilterOpen(true)} style={styles.iconBtn}>
          <Ionicons name="filter" size={22} color={Colors.muted} />
          {hasActiveFilters ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={styles.body}>
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={loadList}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? "Yüklənir..." : "Nəticə yoxdur. Filterləri boşaldıb yenilə."}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("JobDetail", { job: item })}>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.badge}>Gündəlik</Text>
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
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ff3b30",
  },
  body: { flex: 1, padding: 16 },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: {
    backgroundColor: Colors.primarySoft,
    color: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
  },

  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  meta: { marginTop: 6, color: Colors.muted, fontWeight: "800" },
  desc: { marginTop: 8, color: Colors.text, lineHeight: 20 },
});
