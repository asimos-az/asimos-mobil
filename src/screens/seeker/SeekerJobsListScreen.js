import React, { useMemo, useRef, useState, useEffect } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View, DeviceEventEmitter } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { MapPicker } from "../../components/MapPicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { JobsFilterModal } from "../../components/JobsFilterModal";
import { NotificationBell } from "../../components/NotificationBell";

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

export function SeekerJobsListScreen() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const [unread, setUnread] = useState(0);

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

  useFocusEffect(
    React.useCallback(() => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => {});

      // Poll so newly created jobs (by employer/admin) show up even if no manual refresh.
      const t = setInterval(() => {
        loadList();
      }, 15000);
      return () => clearInterval(t);
    }, [])
  );

  // Refresh unread count immediately when a push arrives
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => {});
      // Also refresh the list so new jobs appear without manual reload.
      loadList();
    });
    return () => sub?.remove?.();
  }, []);

  // Guest mode: on first mount, load jobs even if we don't have a saved location yet.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadList();
  }, []);

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

  async function loadList(locOverride) {
    try {
      const loc = locOverride || baseLocation || user?.location;
      setLoading(true);
      // Guest mode: if the user hasn't shared location yet, still show jobs.
      // Backend will fallback to "latest open" when lat/lng is missing.
      const data = await api.listJobsWithSearch({
        q: q?.trim() || "",
        lat: loc?.lat,
        lng: loc?.lng,
        radius_m: loc?.lat && loc?.lng ? radius : undefined,
        daily: undefined,
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
    // First time + whenever user changes location (e.g. via Profile)
    didInit.current = true;
    loadList(location);
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
        userLocation={user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={async (loc) => {
          setBaseLocation(loc);
          didInit.current = true;
          await loadList(loc);
        }}
      />

      <View style={styles.top}>
        <Pressable
          onPress={() => {
            if (!user) {
              Alert.alert(
                "Qeydiyyat tələb olunur",
                "Bildirişləri görmək üçün daxil olmalısan.",
                [
                  { text: "Ləğv", style: "cancel" },
                  { text: "Login / Qeydiyyat", onPress: () => navigation.navigate("AuthEntry") },
                ]
              );
              return;
            }
            navigation.navigate("SeekerNotifications");
          }}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Bildirişlər"
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
          {unread > 0 ? <View style={styles.unreadBadge} /> : null}
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>İş elanları</Text>
        </View>

        <Pressable
          onPress={() => setFilterOpen(true)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Filtrlər"
        >
          <Ionicons name="filter" size={22} color={Colors.primary} />
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
              <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden" }}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.statusDot} />
                    <Text style={styles.jobTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>

                  {item.isDaily ? (
                    <View style={styles.pill}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
                      <Text style={styles.pillText}>Gündəlik</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.metaRow}>
                    {item.category ? (
                      <View style={[styles.chip, styles.chipCategory]}>
                        <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
                        <Text style={[styles.chipText, { color: Colors.primary }]} numberOfLines={1}>
                          {item.category}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.kvRow}>
                    <View style={styles.kvItem}>
                      <Ionicons name="cash-outline" size={16} color={Colors.muted} />
                      <Text style={styles.kvText}>{item.wage || "—"}</Text>
                    </View>

                    {typeof item.distanceM === "number" ? (
                      <View style={styles.kvItem}>
                        <Ionicons name="navigate-outline" size={16} color={Colors.muted} />
                        <Text style={styles.kvText}>{item.distanceM} m</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
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
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
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
  unreadBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: Colors.card,
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
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  help: { marginTop: 6, color: Colors.muted, fontSize: 12, fontWeight: "700" },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },

  two: { flexDirection: "row", gap: 10 },

  // Card (same style as employer)
  cardHeader: {
    padding: 14,
    paddingBottom: 10,
    backgroundColor: Colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 99, backgroundColor: Colors.primary },
  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text, flex: 1 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: { fontWeight: "900", color: Colors.primary },
  cardBody: { padding: 14 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipCategory: { backgroundColor: Colors.primarySoft, borderColor: Colors.border },
  chipText: { fontWeight: "900" },
  kvRow: { flexDirection: "row", gap: 14, marginTop: 10, flexWrap: "wrap" },
  kvItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  kvText: { fontWeight: "900", color: Colors.muted },
  desc: { marginTop: 10, color: Colors.text, lineHeight: 20, fontWeight: "700" },
});
