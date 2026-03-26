import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";

import { SafeScreen } from "../../components/SafeScreen";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useAlert } from "../../context/AlertContext";
import { MapPicker } from "../../components/MapPicker";
import { PrimaryButton } from "../../components/PrimaryButton";
import { registerForPushNotificationsAsync } from "../../utils/pushNotifications";
import { getDeviceLocationOrNull } from "../../utils/deviceLocation";
import { api } from "../../api/client";
import { styles } from "./SeekerProfileScreen.styles";

export function SeekerProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, updateLocation, isSigningOut } = useAuth();
  const { showAlert } = useAlert();
  const toast = useToast();

  if (!user) {
    if (isSigningOut) return null;
    return (
      <SafeScreen style={styles.safeArea}>
        <View style={styles.guestWrap}>
          <View style={styles.guestIcon}>
            <Ionicons name="lock-closed" size={32} color="#CBD5E1" />
          </View>
          <Text style={styles.guestTitle}>Giriş tələb olunur</Text>
          <Text style={styles.guestSub}>
            Profilinizi görmək üçün sistemə daxil olun.
          </Text>
          <PrimaryButton title="Login / Qeydiyyat" onPress={() => navigation.navigate("AuthEntry")} />
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
    if (!name) return "S";
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "S";
  }, [user?.fullName]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ENABLED_KEY = "ASIMOS_NOTIF_ENABLED_V2";
      const TOKEN_KEY = "ASIMOS_EXPO_PUSH_TOKEN_V2";

      const enabled = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);
      const perm = await Notifications.getPermissionsAsync().catch(() => ({ status: "undetermined" }));

      if (perm?.status === "granted" && enabled !== "0") {
        setNotifEnabled(true);
        const token = await registerForPushNotificationsAsync();
        if (!alive || !token) return;
        await AsyncStorage.setItem(ENABLED_KEY, "1").catch(() => { });
        const prev = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
        if (prev !== token) {
          await api.setPushToken(token).catch(() => { });
          await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => { });
        }
      } else if (alive) {
        setNotifEnabled(false);
      }

      const soundVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_ENABLED").catch(() => null);
      if (alive && soundVal !== null) setSoundEnabled(soundVal === "1");
      const nameVal = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_NAME").catch(() => null);
      if (alive && nameVal) setSoundName(nameVal);
    })();
    return () => { alive = false; };
  }, []);

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
          setStats({ totalNotifs: items.length, unread: Number(unreadRes?.unread || 0), hasLoc });
        }
      } catch {
        if (alive) setStats({ totalNotifs: 0, unread: 0, hasLoc: user?.location?.lat ? 1 : 0 });
      } finally {
        if (alive) setStatsLoading(false);
      }
    }
    loadStats();
    const unsub = navigation.addListener?.("focus", loadStats);
    return () => { alive = false; if (unsub) unsub(); };
  }, [navigation, user?.location?.lat, user?.location?.lng]);

  async function onPickedLocation(loc) {
    if (locLoading) return;
    setLocLoading(true);
    try {
      await updateLocation(loc);
      toast.show("Lokasiya yeniləndi", "success");
    } catch (e) {
      toast.show(e?.message || "Lokasiya yenilənmədi", "error");
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
      toast.show(e?.message || "Dəyişiklik alınmadı", "error");
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
    <SafeScreen style={styles.safeArea}>
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
            <Text style={styles.modalTitle}>Səs tonu</Text>
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
                  {soundName === item.id && <Ionicons name="checkmark" size={20} color="#000" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSoundPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Bağla</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ScrollView style={styles.scrollFlex} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* CENTERED AVATAR & INFO */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || "İş axtaran"}</Text>
          <Text style={styles.userEmail}>{user?.email || "Email qeyd edilməyib"}</Text>
        </View>

        {/* MINIMAL STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statLine}>
            <Text style={styles.statValue}>{stats.totalNotifs}</Text>
            <Text style={styles.statLabel}>Bildiriş</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statLine}>
            <Text style={styles.statValue}>{stats.unread}</Text>
            <Text style={styles.statLabel}>Oxunmamış</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statLine}>
            <Text style={styles.statValue}>{stats.hasLoc ? "Var" : "Yoxdur"}</Text>
            <Text style={styles.statLabel}>GPS</Text>
          </View>
        </View>

        {/* SETTINGS GROUPS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Məlumatlar</Text>
          <View style={styles.cardGroup}>
            <View style={styles.listItem}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <Text style={styles.listItemText}>{user?.phone || "Telefon yoxdur"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.listItem}>
              <Ionicons name="location-outline" size={20} color="#64748B" />
              <View style={styles.flex1}>
                <Text style={styles.listItemText} numberOfLines={1}>
                  {user?.location?.address || "Lokasiya seçilməyib"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMapOpen(true)} style={styles.listActionBtn}>
                <Text style={styles.listActionText}>Yenilə</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tənzimləmələr</Text>
          <View style={styles.cardGroup}>
            <View style={styles.listItem}>
              <Ionicons name={notifEnabled ? "notifications-outline" : "notifications-off-outline"} size={20} color="#64748B" />
              <Text style={styles.listItemText}>Bildirişlər</Text>
              <Switch
                value={notifEnabled}
                onValueChange={toggleNotifications}
                disabled={notifLoading}
                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.listItem}>
              <Ionicons name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"} size={20} color="#64748B" />
              <Text style={styles.listItemText}>Səslər</Text>
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                disabled={soundLoading}
                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                thumbColor="#fff"
              />
            </View>

            {soundEnabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.listItem} onPress={() => setSoundPickerOpen(true)}>
                  <Ionicons name="musical-notes-outline" size={20} color="#64748B" />
                  <Text style={styles.listItemText}>Səs tonu</Text>
                  <View style={styles.flexRowRight}>
                    <Text style={styles.listValueText}>
                      {SOUND_OPTIONS.find((s) => s.id === soundName)?.label || "Defolt"}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate("Support")}>
              <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
              <Text style={styles.listItemText}>Dəstək</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.listItem} onPress={() => Linking.openURL("https://www.asimos.az/policy")}>
              <Ionicons name="document-text-outline" size={20} color="#64748B" />
              <Text style={styles.listItemText}>Qaydalar və Şərtlər</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.listItem} onPress={() => {
              showAlert("ÇIXIŞ", "Hesabdan çıxmaq istəyirsən?", [
                { text: "İMTİNA", style: "cancel" },
                { text: "ÇIX", style: "destructive", onPress: signOut },
              ]);
            }}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={[styles.listItemText, styles.listItemDangerText]}>Çıxış</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer40} />
      </ScrollView>
    </SafeScreen>
  );
}