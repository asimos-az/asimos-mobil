import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View, Modal, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { MapPicker } from "../../components/MapPicker";
import { PrimaryButton } from "../../components/PrimaryButton";
import { registerForPushNotificationsAsync } from "../../utils/pushNotifications";
import { api } from "../../api/client";

export function SeekerProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, updateLocation, isSigningOut } = useAuth();

  // Guest mode: profile requires an account
  if (!user) {
    if (isSigningOut) return null;
    return (
      <SafeScreen>
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Ionicons name="lock-closed" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Profil üçün daxil ol</Text>
          <Text style={styles.guestSub}>
            Bildirişlər, lokasiya və əlaqə məlumatlarını görmək üçün qeydiyyatdan keç.
          </Text>
          <PrimaryButton
            title="Qeydiyyat / Login"
            onPress={() => navigation.navigate("AuthEntry")}
          />
        </View>
      </SafeScreen>
    );
  }

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
  const [stats, setStats] = useState({ totalNotifs: 0, unread: 0, hasLoc: 0 });

  const initials = useMemo(() => {
    const name = (user?.fullName || "").trim();
    if (!name) return "A";
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "A";
  }, [user?.fullName]);

  // Sync notification switch with OS permission + token state
  useEffect(() => {
    let alive = true;
    (async () => {
      const ENABLED_KEY = "ASIMOS_NOTIF_ENABLED_V2";
      const TOKEN_KEY = "ASIMOS_EXPO_PUSH_TOKEN_V2";

      const enabled = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);

      // 1. Check OS Permission
      const perm = await Notifications.getPermissionsAsync().catch(() => ({ status: "undetermined" }));

      // If OS permission is granted
      if (perm?.status === "granted") {
        // Optimistically show as ON if not explicitly disabled by user
        if (enabled !== "0") {
          setNotifEnabled(true);
        }

        // Try to sync token in background
        if (enabled !== "0") {
          const token = await registerForPushNotificationsAsync();
          if (!alive) return;

          if (token) {
            // Sync state
            await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => { });
            // Ensure token is on server
            const prev = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
            if (prev !== token) {
              await api.setPushToken(token).catch(() => { });
              await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => { });
            }
            return;
          }
        }
      }

      // Otherwise off
      if (alive) setNotifEnabled(false);

      // Load sound setting
      const soundVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_ENABLED").catch(() => null);
      if (alive && soundVal !== null) {
        setSoundEnabled(soundVal === "1");
      }

      // Load sound name
      const nameVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_NAME").catch(() => null);
      if (alive && nameVal) {
        setSoundName(nameVal);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Lightweight stats for seeker (notifications + location)
  useEffect(() => {
    let alive = true;

    async function loadStats() {
      setStatsLoading(true);
      try {
        const unreadRes = await api.getUnreadNotificationsCount().catch(() => ({ unread: 0 }));
        const listRes = await api.listMyNotifications({ limit: 200, offset: 0 }).catch(() => []);
        const items = Array.isArray(listRes?.items) ? listRes.items : Array.isArray(listRes) ? listRes : [];
        const hasLoc = user?.location?.lat && user?.location?.lng ? 1 : 0;

        if (alive) {
          setStats({
            totalNotifs: items.length,
            unread: Number(unreadRes?.unread || 0),
            hasLoc,
          });
        }
      } catch {
        if (alive) setStats({ totalNotifs: 0, unread: 0, hasLoc: user?.location?.lat && user?.location?.lng ? 1 : 0 });
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
  }, [navigation, user?.location?.lat, user?.location?.lng]);

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
          await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V2", "0");
          return;
        }
        await api.setPushToken(token);
        setNotifEnabled(true);
        await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V2", "1");
        toast.show("Bildirişlər aktiv edildi", "success");
      } else {
        await api.clearPushToken().catch(() => { });
        setNotifEnabled(false);
        await AsyncStorage.setItem("ASIMOS_NOTIF_ENABLED_V2", "0");
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
      // ignore
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
            <Text style={styles.hName} numberOfLines={1}>
              {user?.fullName || "—"}
            </Text>
            <Text style={styles.hSub} numberOfLines={1}>
              İş axtaran
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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
              <Pressable
                onPress={() => setMapOpen(true)}
                style={({ pressed }) => [styles.locPill, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="map-outline" size={16} color={Colors.primary} />
                <Text style={styles.locPillText}>Xəritə</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Statistika</Text>
              {statsLoading ? <Text style={styles.statsHint}>Yüklənir…</Text> : <Text style={styles.statsHint}>Bu hesab üzrə</Text>}
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statBox, styles.statBoxPrimary]}>
                <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.totalNotifs}</Text>
                <Text style={styles.statLabel}>Bildirişlər</Text>
              </View>

              <View style={[styles.statBox, styles.statBoxSuccess]}>
                <Ionicons name="mail-unread-outline" size={18} color={Colors.success} />
                <Text style={styles.statValue}>{stats.unread}</Text>
                <Text style={styles.statLabel}>Oxunmamış</Text>
              </View>

              <View style={[styles.statBox, styles.statBoxMuted]}>
                <Ionicons name="location-outline" size={18} color={Colors.muted} />
                <Text style={styles.statValue}>{stats.hasLoc ? "✓" : "—"}</Text>
                <Text style={styles.statLabel}>Lokasiya</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Ionicons name={notifEnabled ? "notifications-outline" : "notifications-off-outline"} size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Bildirişlər</Text>
                  <Text style={styles.toggleSub}>Yeni vakansiyalar və yeniliklər</Text>
                </View>
              </View>

              <Switch value={notifEnabled} onValueChange={toggleNotifications} disabled={notifLoading} />
            </View>

            <View style={{ height: 16 }} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={styles.toggleIcon}>
                  <Ionicons
                    name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"}
                    size={18}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Bildiriş səsləri</Text>
                  <Text style={styles.toggleSub}>Proqram daxilində səsli bildirişlər</Text>
                </View>
              </View>

              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                disabled={soundLoading}
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
                      <Text style={styles.toggleSub}>
                        {SOUND_OPTIONS.find((s) => s.id === soundName)?.label || "Defolt"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
                </Pressable>
              </>
            )}

            <View style={{ height: 14 }} />

            <PrimaryButton title="Lokasiyanı yenilə" loading={locLoading} onPress={() => setMapOpen(true)} />
            <View style={{ height: 10 }} />
            <PrimaryButton variant="secondary" title="Çıxış" onPress={signOut} />
          </Card>

          <View style={{ height: 18 }} />

          <Pressable
            onPress={() => navigation.navigate("SeekerNotifications")}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickBtnText}>Bildirişlərə bax</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </Pressable>

          <View style={{ height: 10 }} />

          <Pressable
            onPress={() => navigation.navigate("JobAlerts")}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="flash-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickBtnText}>İş Bildirişləri (Job Alerts)</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </Pressable>

          <View style={{ height: 10 }} />

          <Pressable
            onPress={() => navigation.navigate("Terms", { slug: "terms", title: "Qaydalar" })}
            style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            <Text style={styles.quickBtnText}>Qaydalar və Şərtlər</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
          </Pressable>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  guestWrap: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  guestIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: { fontSize: 18, fontWeight: "900", color: Colors.text },
  guestSub: { textAlign: "center", color: Colors.muted, fontWeight: "800", lineHeight: 18 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "900", color: Colors.primary, fontSize: 18 },
  hName: { fontSize: 18, fontWeight: "900", color: Colors.text },
  hSub: { marginTop: 2, color: Colors.muted, fontWeight: "800" },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  body: { flex: 1 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  infoText: { color: Colors.text, fontWeight: "800", flex: 1 },
  locSub: { marginTop: 2, color: Colors.muted, fontSize: 12, fontWeight: "700" },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  locPillText: { fontWeight: "900", color: Colors.primary },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },

  statsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statsTitle: { fontSize: 14, fontWeight: "900", color: Colors.text },
  statsHint: { color: Colors.muted, fontWeight: "800" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  statBox: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 6,
  },
  statBoxPrimary: { backgroundColor: Colors.primarySoft },
  statBoxSuccess: { backgroundColor: "#E9FBEF" },
  statBoxMuted: { backgroundColor: "#F7F8FA" },
  statValue: { fontSize: 18, fontWeight: "900", color: Colors.text },
  statLabel: { color: Colors.muted, fontWeight: "800" },

  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTitle: { fontWeight: "900", color: Colors.text },
  toggleSub: { marginTop: 2, color: Colors.muted, fontWeight: "700", fontSize: 12 },

  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  quickBtnText: { flex: 1, fontWeight: "900", color: Colors.text },

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
