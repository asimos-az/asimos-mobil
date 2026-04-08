import React, { useMemo, useRef, useState, useEffect } from "react";
import { getDeviceLocationOrNull } from "../../utils/deviceLocation";
import { Alert, FlatList, Pressable, StyleSheet, Text, View, DeviceEventEmitter, ActivityIndicator } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { MapPicker } from "../../components/MapPicker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { JobCard } from "../../components/JobCard";
import { JobsFilterModal } from "../../components/JobsFilterModal";
import { NotificationBell } from "../../components/NotificationBell";
import * as Notifications from "expo-notifications";

const RADIUS_PRESETS = [
  { label: "Ölkə üzrə", value: 0 },
  { label: "1km", value: 1000 },
  { label: "5km", value: 5000 },
  { label: "10km", value: 10000 },
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
  const prevUnread = useRef(0);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filterOpen, setFilterOpen] = useState(false);

  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(0);
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [mapOpen, setMapOpen] = useState(false);
  const [baseLocation, setBaseLocation] = useState(user?.location || null);

  const location = baseLocation || user?.location;
  const didInit = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      async function syncUnread() {
        try {
          const r = await api.getUnreadNotificationsCount();
          const current = r?.unread || 0;
          if (current > prevUnread.current) {
            await Notifications.scheduleNotificationAsync({
              content: { title: "Yeni bildiriş", body: "Sizin üçün yeni bildiriş var.", sound: true },
              trigger: null,
            });
          }
          prevUnread.current = current;
          setUnread(current);
        } catch {}
      }
      syncUnread();

      const t = setInterval(syncUnread, 5000);
      return () => clearInterval(t);
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => { });
      loadList(null, 1);
    });
    return () => sub?.remove?.();
  }, [baseLocation, user?.location]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      if (user?.location) {
        loadList(user.location, 1);
      } else {
        setLoading(true);
        try {
          const fresh = await getDeviceLocationOrNull({ timeoutMs: 4000 });
          if (fresh) {
            setBaseLocation(fresh);
            loadList(fresh, 1);
          } else {
            loadList(null, 1);
          }
        } catch {
          loadList(null, 1);
        }
      }
    })();
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

  async function loadList(locOverride, pageNumber = 1, qOverride = null) {
    try {
      const loc = locOverride || baseLocation || user?.location;
      if (pageNumber === 1) setLoading(true);
      else setLoadingMore(true);

      const effectiveQ = qOverride !== null ? String(qOverride || "").trim() : (q?.trim() || "");
      const data = await api.listJobsWithSearch({
        q: effectiveQ,
        lat: loc?.lat,
        lng: loc?.lng,
        radius_m: (radius > 0 && loc?.lat && loc?.lng) ? radius : undefined,
        page: pageNumber,
        limit: 20
      });
      
      if (pageNumber === 1) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
      }
      
      if (data && data.length < 20) setHasMore(false);
      else setHasMore(true);
      
      setPage(pageNumber);
    } catch (e) {
      if (pageNumber === 1) Alert.alert("Xəta", e.message);
    } finally {
      if (pageNumber === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }

  function fetchMore() {
    if (!loading && !loadingMore && hasMore) {
      loadList(null, page + 1);
    }
  }


  useEffect(() => {
    if (!baseLocation && user?.location) setBaseLocation(user.location);
  }, [user?.location?.lat, user?.location?.lng]);

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    didInit.current = true;
    loadList(location);
    if (!location?.lat || !location?.lng) return;
    didInit.current = true;
    loadList(location);
  }, [location?.lat, location?.lng]);


  const hasActiveFilters = !!(q?.trim() || minWage || maxWage || (selectedCategories?.length) || radius > 0);

  function toggleCategory(cat) {
    setSelectedCategories((prev) => {
      const s = new Set(prev || []);
      if (s.has(cat)) s.delete(cat); else s.add(cat);
      return Array.from(s);
    });
  }

  function resetFilters() {
    setQ("");
    setRadius(0);
    setMinWage("");
    setMaxWage("");
    setSelectedCategories([]);
    setBaseLocation(user?.location || null);
  }

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation])
  );

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
        onApply={(nextQ) => {
          setFilterOpen(false);
          loadList(null, 1, nextQ ?? null);
        }}
        onClose={() => setFilterOpen(false)}
      />

      <MapPicker
        visible={mapOpen}
        initial={location}
        userLocation={baseLocation || user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={async (loc) => {
          setBaseLocation(loc);
          didInit.current = true;
          await loadList(loc);
        }}
      />

      {/* Main Header */}
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Text style={styles.brandTitle}>Asimos</Text>
        </View>

        <View style={styles.headerActions}>
          <NotificationBell count={unread} onPress={() => navigation.navigate("SeekerNotifications")} />

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
      </View>





      <View style={styles.body}>
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={() => loadList(null, 1)}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? "Yüklənir..." : "Nəticə yoxdur. Filterləri boşaldıb yenilə."}
            </Text>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary} style={{ padding: 20 }} /> : null}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => navigation.navigate("JobDetail", { job: item })}
              showEdit={(item?.createdBy || item?.created_by) === user?.id}
              onEdit={() => navigation.navigate("SeekerCreateAd", { job: item })}
            />
          )}
        />
      </View>

      {/* Floating Map Button */}
      {
        user ? (
          <View style={styles.floatBtnWrap}>
            <Pressable
              style={styles.floatBtn}
              onPress={() => navigation.navigate('SeekerMap', { jobs: items, userLocation: baseLocation })}
            >
              <Ionicons name="map" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : null
      }
    </SafeScreen >
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.text,
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: Colors.bg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: { fontSize: 22, fontWeight: "900", color: "#111827" },
  headerActions: { flexDirection: "row", gap: 12 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderWidth: 1,
    borderColor: "#fff",
  },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  help: { marginTop: 6, color: Colors.muted, fontSize: 12, fontWeight: "700" },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 40, fontWeight: "700", fontSize: 15 },

  two: { flexDirection: "row", gap: 10 },

  floatBtnWrap: {
    position: 'absolute',
    bottom: 44,
    right: 16,
    zIndex: 99
  },
  floatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  tabText: {
    fontWeight: '700',
    color: Colors.text
  },
  tabTextActive: {
    color: '#fff'
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16
  }
});
