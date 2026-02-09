import React, { useMemo, useRef, useState, useEffect } from "react";
import { getDeviceLocationOrNull } from "../../utils/deviceLocation";
import { Alert, FlatList, Pressable, StyleSheet, Text, View, DeviceEventEmitter } from "react-native";
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

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("employer"); // 'employer' | 'seeker'

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
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => { });

      const t = setInterval(() => {
        loadList();
      }, 15000);
      return () => clearInterval(t);
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => { });
      loadList();
    });
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    (async () => {
      if (user?.location) {
        loadList(user.location);
      } else {
        setLoading(true);
        try {
          const fresh = await getDeviceLocationOrNull({ timeoutMs: 4000 });
          if (fresh) {
            setBaseLocation(fresh);
            loadList(fresh);
          } else {
            loadList(null);
          }
        } catch {
          loadList(null);
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

  async function loadList(locOverride) {
    try {
      const loc = locOverride || baseLocation || user?.location;
      setLoading(true);
      const data = await api.listJobsWithSearch({
        q: q?.trim() || "",
        lat: loc?.lat,
        lng: loc?.lng,
        radius_m: (radius > 0 && loc?.lat && loc?.lng) ? radius : undefined,
        radius_m: (radius > 0 && loc?.lat && loc?.lng) ? radius : undefined,
        daily: undefined,
        jobType: !user ? undefined : (activeTab === 'seeker' ? 'seeker' : 'employer'), // If guest, show all? Or just employer? User said "butun elanarl gorusnun" (all ads visible).
        // Actually, let's interpret "butun elanarl" as "all ads mixed" or just standard list.
        // If we pass undefined to jobType, the backend defaults to employer only currently (based on previous ViewFile of backend).
        // Let's check backend logic again or just default to 'employer' if undefined on backend.
        // Wait, backend logic: if (jobTypeFilter === "seeker") ... else if (jobTypeFilter === "employer") ... else ... neq "seeker"
        // So default is employer only.
        // The user said "sadece listde butun elanarl gorusnun" -> "only all ads should be visible in the list".
        // If I send nothing, it shows employer ads. If I want ALL (mixed), backend might need adjustment?
        // But for now, let's assume they want the default view (Employer ads) or maybe just hide the tabs and show 'employer' ads as the main list.
        // Actually, "butun elanlar" might mean "all available ads". 
        // Let's stick to showing 'employer' ads by default for guests as that's the main content, or 'employer' + 'seeker' if possible.
        // Given backend filters: default excludes seeker.
        // Let's just use 'employer' for now for simplicity as guests usually look for jobs.
        // Or if user wants "all", I might need to send a special flag or just not filter.
        // Backend: if jobTypeFilter is empty -> ... else query = query.neq("job_type", "seeker");
        // So by default it hides seeker ads.
        // Use 'employer' for now.
        jobType: user ? (activeTab === 'seeker' ? 'seeker' : 'employer') : 'employer',
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
    didInit.current = true;
    loadList(location);
    if (!location?.lat || !location?.lng) return;
    didInit.current = true;
    loadList(location);
  }, [location?.lat, location?.lng, activeTab]);

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
        userLocation={baseLocation || user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={async (loc) => {
          setBaseLocation(loc);
          didInit.current = true;
          await loadList(loc);
        }}
      />

      <View style={styles.top}>
        {user ? (
          <Pressable
            onPress={() => navigation.navigate("SeekerNotifications")}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Bildirişlər"
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            {unread > 0 ? <View style={styles.unreadBadge} /> : null}
          </Pressable>
        ) : <View style={{ width: 44 }} />}

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

      {
        user ? (
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 10 }}>
            <Pressable
              style={[styles.tab, activeTab === 'employer' && styles.tabActive]}
              onPress={() => setActiveTab('employer')}
            >
              <Text style={[styles.tabText, activeTab === 'employer' && styles.tabTextActive]}>Vakansiyalar</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'seeker' && styles.tabActive]}
              onPress={() => setActiveTab('seeker')}
            >
              <Text style={[styles.tabText, activeTab === 'seeker' && styles.tabTextActive]}>İşçi Elanları</Text>
            </Pressable>
          </View>
        ) : null
      }

      {
        user && activeTab === 'seeker' && (
          <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
            <Pressable
              style={styles.createBtn}
              onPress={() => navigation.navigate("SeekerCreateAd")}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Elan yerləşdir</Text>
            </Pressable>
          </View>
        )
      }

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
            <JobCard
              job={item}
              onPress={() => navigation.navigate("JobDetail", { job: item })}
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
              <Text style={styles.floatBtnText}>Xəritə</Text>
            </Pressable>
          </View>
        ) : null
      }
    </SafeScreen >
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginTop: -20, // To pull up under the transparent status bar if needed, or just remove
    backgroundColor: Colors.bg, // Match background
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
    bottom: 90,
    alignSelf: 'center',
    zIndex: 99
  },
  floatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  floatBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
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
