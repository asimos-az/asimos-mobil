import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View, Switch, Pressable, Modal, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../../utils/pushNotifications";
import { api } from "../../api/client";

export function EmployerProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, updateLocation } = useAuth();
  const [locLoading, setLocLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundName, setSoundName] = useState("default");
  const [soundPickerOpen, setSoundPickerOpen] = useState(false);

  const SOUND_OPTIONS = [
    { id: "default", label: "Defolt" },
    { id: "note", label: "Note" },
    { id: "aurora", label: "Aurora" },
    { id: "bamboo", label: "Bamboo" },
    { id: "chord", label: "Chord" },
  ];
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0 });

  const initials = useMemo(() => {
    const name = (user?.fullName || "").trim();
    if (!name) return "A";
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "A";
  }, [user?.fullName]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ENABLED_KEY = "ASIMOS_NOTIF_ENABLED_V1";
      const TOKEN_KEY = "ASIMOS_EXPO_PUSH_TOKEN_V1";

      const enabled = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);
      if (enabled === "0") {
        if (alive) setNotifEnabled(false);
        return;
      }

      const perm = await Notifications.getPermissionsAsync().catch(() => ({ status: "undetermined" }));
      if (perm?.status === "granted") {
        const token = await registerForPushNotificationsAsync();
        if (!alive) return;
        if (token) {
          await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => { });
          const prev = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
          if (prev !== token) {
            try { await api.setPushToken(token); } catch { }
            await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => { });
          }
          setNotifEnabled(true);
          return;
        }
      }

      if (alive) setNotifEnabled(false);

      const soundVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_ENABLED").catch(() => null);
      if (alive && soundVal !== null) {
        setSoundEnabled(soundVal === "1");
      }

      const nameVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_NAME").catch(() => null);
      if (alive && nameVal) {
        setSoundName(nameVal);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadStats() {
      if (!user?.id) return;
      setStatsLoading(true);
      try {
        const res = await api.listMyJobs(user.id);
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        let open = 0;
        let closed = 0;
        for (const j of items) {
          const st = String(j?.status || "open").toLowerCase();
          if (st === "closed") closed += 1;
          else open += 1;
        }
        if (alive) setStats({ total: items.length, open, closed });
      } catch {
        if (alive) setStats({ total: 0, open: 0, closed: 0 });
      } finally {
        if (alive) setStatsLoading(false);
      }
    }

    loadStats();
    const unsub = navigation.addListener?.("focus", loadStats);
    return () => {
      alive = false;
      if (typeof unsub === "function") unsub();
    };
  }, [navigation, user?.id]);

  function goCreateJob() {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerCreateJob");
    else navigation.navigate("EmployerCreateJob");
  }

  const toast = useToast();

  async function onPickedLocation(loc) {
    if (locLoading) return;
    setLocLoading(true);
    try {
      await updateLocation(loc);
      toast.show("Lokasiya yeniləndi", "success");
    } catch (e) {
      toast.show(e.message || "Lokasiya yenilənmədi", "error");
    } finally {
      setLocLoading(false);
    }
  }

  async function toggleNotifications(next) {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (next) {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          toast.show("Bildirişləri aktiv etmək üçün telefonda icazə ver.", "error");
          setNotifEnabled(false);
          await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "0");
          return;
        }
        await api.setPushToken(token);
        setNotifEnabled(true);
        await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "1");
        toast.show("Bildirişlər aktiv edildi", "success");
      } else {
        await api.clearPushToken().catch(() => { });
        setNotifEnabled(false);
        await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V1", "0");
        toast.show("Bildirişlər söndürüldü", "success");
      }
    } catch (e) {
      toast.show(e.message || "Dəyişiklik alınmadı", "error");
    } finally {
      setNotifLoading(false);
    }
  }

  async function toggleSound(val) {
    if (soundLoading) return;
    setSoundLoading(true);
    try {
      setSoundEnabled(val);
      await AsyncStorage.setItem("ASIMOS_NOTIF_SOUND_ENABLED", val ? "1" : "0");
    } catch {
    } finally {
      setSoundLoading(false);
    }
  }

  async function selectSound(item) {
    setSoundName(item.id);
    setSoundPickerOpen(false);
    await AsyncStorage.setItem("ASIMOS_NOTIF_SOUND_NAME", item.id).catch(() => { });
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={user?.location || null}
        userLocation={user?.location || null}
        onClose={() => setMapOpen(false)}
        onPicked={onPickedLocation}
      />

      <Modal visible={soundPickerOpen} transparent animationType="fade" onRequestClose={() => setSoundPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSoundPickerOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Səs tonu seçin</Text>
            <FlatList
              data={SOUND_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.soundItem, soundName === item.id && styles.soundItemActive]}
                  onPress={() => selectSound(item)}
                >
                  <Text style={[styles.soundText, soundName === item.id && styles.soundTextActive]}>
                    {item.label}
                  </Text>
                  {soundName === item.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSoundPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Bağla</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.hName} numberOfLines={1}>{user?.fullName || "—"}</Text>
            <Text style={styles.hSub} numberOfLines={1}>{user?.companyName ? `HR • ${user.companyName}` : "HR"}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="always"
      >
        <Card>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.muted} />
            <Text style={styles.infoText}>{user?.email || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color={Colors.muted} />
            <Text style={styles.infoText}>{user?.phone || "—"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={Colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText} numberOfLines={2}>
                {user?.location?.address || "Lokasiya seçilməyib"}
              </Text>
              {!!user?.location?.lat && !!user?.location?.lng && (
                <Text style={styles.locSub} numberOfLines={1}>
                  {Number(user.location.lat).toFixed(5)}, {Number(user.location.lng).toFixed(5)}
                </Text>
              )}
            </View>
            <Pressable onPress={() => setMapOpen(true)} style={({ pressed }) => [styles.locPill, pressed && { opacity: 0.85 }]}>
              <Ionicons name="map-outline" size={16} color={Colors.primary} />
              <Text style={styles.locPillText}>Xəritə</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Statistika */}
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Statistika</Text>
            {statsLoading ? (
              <Text style={styles.statsHint}>Yüklənir…</Text>
            ) : (
              <Text style={styles.statsHint}>Bu hesab üzrə</Text>
            )}
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statBox, styles.statBoxPrimary]}>
              <Ionicons name="list-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Toplam elan</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxSuccess]}>
              <Ionicons name="flash-outline" size={18} color={Colors.success} />
              <Text style={styles.statValue}>{stats.open}</Text>
              <Text style={styles.statLabel}>Aktiv</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMuted]}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.muted} />
              <Text style={styles.statValue}>{stats.closed}</Text>
              <Text style={styles.statLabel}>Bağlı</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <Ionicons name={notifEnabled ? "notifications" : "notifications-off"} size={18} color={notifEnabled ? Colors.primary : Colors.muted} />
              </View>
              <View>
                <Text style={styles.toggleTitle}>Bildirişlər</Text>
                <Text style={styles.toggleDesc}>Yeni vakansiyalar və yeniliklər</Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={(v) => toggleNotifications(v)}
              disabled={notifLoading}
              trackColor={{ false: Colors.border, true: Colors.primarySoft }}
              thumbColor={notifEnabled ? Colors.primary : "#fff"}
            />
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <Ionicons
                  name={soundEnabled ? "volume-high" : "volume-mute"}
                  size={18}
                  color={soundEnabled ? Colors.primary : Colors.muted}
                />
              </View>
              <View>
                <Text style={styles.toggleTitle}>Bildiriş səsləri</Text>
                <Text style={styles.toggleDesc}>Proqram daxilində səsli bildirişlər</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              disabled={soundLoading}
              trackColor={{ false: Colors.border, true: Colors.primarySoft }}
              thumbColor={soundEnabled ? Colors.primary : "#fff"}
            />
          </View>

          {soundEnabled && (
            <>
              <View style={{ height: 12 }} />
              <Pressable
                style={({ pressed }) => [styles.toggleRow, pressed && { opacity: 0.7 }]}
                onPress={() => setSoundPickerOpen(true)}
              >
                <View style={styles.toggleLeft}>
                  <View style={styles.toggleIcon}>
                    <Ionicons name="musical-notes-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Səs tonu</Text>
                    <Text style={styles.toggleDesc}>
                      {SOUND_OPTIONS.find((s) => s.id === soundName)?.label || "Defolt"}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
              </Pressable>
            </>
          )}

          <View style={{ height: 14 }} />
          <PrimaryButton
            title="Vakansiya yarat"
            onPress={goCreateJob}
            iconName="add-circle-outline"
            variant="primary"
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title={locLoading ? "Lokasiya yenilənir..." : "Lokasiyanı yenilə"}
            loading={locLoading}
            onPress={() => setMapOpen(true)}
            iconName="navigate-outline"
            variant="outline"
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            title="Çıxış"
            onPress={() => Alert.alert("Çıxış", "Hesabdan çıxmaq istəyirsən?", [
              { text: "İmtina", style: "cancel" },
              { text: "Çıx", style: "destructive", onPress: signOut },
            ])}
            iconName="log-out-outline"
            variant="danger"
          />
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: { fontWeight: "900", color: Colors.primary, fontSize: 16 },
  hName: { fontSize: 18, fontWeight: "900", color: Colors.text },
  hSub: { marginTop: 2, color: Colors.muted, fontWeight: "800" },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16, paddingBottom: 160 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  infoText: { color: Colors.text, fontWeight: "800", flex: 1 },
  locSub: { marginTop: 2, color: Colors.muted, fontWeight: "700", fontSize: 12 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locPillText: { color: Colors.primary, fontWeight: "900", fontSize: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  statsHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  statsTitle: { fontWeight: "900", color: Colors.text, fontSize: 14 },
  statsHint: { fontWeight: "800", color: Colors.muted, fontSize: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 110,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  statBoxPrimary: { backgroundColor: Colors.primarySoft },
  statBoxSuccess: { backgroundColor: "#ECFDF5" },
  statBoxMuted: { backgroundColor: Colors.bg },
  statValue: { marginTop: 8, color: Colors.text, fontWeight: "900", fontSize: 20 },
  statLabel: { marginTop: 2, color: Colors.muted, fontWeight: "900", fontSize: 12 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 10 },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTitle: { fontWeight: "900", color: Colors.text },
  toggleDesc: { color: Colors.muted, fontWeight: "700", marginTop: 2, fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: Colors.text, marginBottom: 16, textAlign: "center" },
  soundItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  soundItemActive: { backgroundColor: Colors.primarySoft + "30", marginHorizontal: -20, paddingHorizontal: 20 },
  soundText: { fontSize: 16, fontWeight: "700", color: Colors.text },
  soundTextActive: { color: Colors.primary, fontWeight: "900" },
  modalClose: { marginTop: 16, alignItems: "center", padding: 10 },
  modalCloseText: { fontWeight: "900", color: Colors.muted },
});
