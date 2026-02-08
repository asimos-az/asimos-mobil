import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, DeviceEventEmitter } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

function formatTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export function SeekerNotificationsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { signOut } = useAuth(); // Import signOut

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.listMyNotifications({ limit: 60, offset: 0 });
      setItems(res?.items || []);
    } catch (e) {
      if (e?.status === 401 || e?.message?.includes("Invalid token") || e?.message?.includes("Refresh failed")) {
        Alert.alert("Sessiya bitib", "Zəhmət olmasa yenidən daxil olun.", [
          { text: "Daxil ol", onPress: () => signOut() }
        ]);
      } else {
        Alert.alert("Xəta", e.message || "Bildirişlər yüklənmədi");
      }
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      load();
    });
    return () => sub?.remove?.();
  }, [load]);

  const unreadCount = useMemo(() => (items || []).filter((n) => !n.read_at).length, [items]);

  async function openItem(n) {
    try {
      if (!n?.read_at) {
        api.markNotificationRead(n.id).catch(() => { });
      }

      const data = n?.data || {};
      if (data?.type === "job" && data?.jobId) {
        const job = await api.getJobById(data.jobId);
        navigation.navigate("JobDetail", { job });
      }
    } catch (e) {
      Alert.alert("Xəta", e.message || "Açılmadı");
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      setItems((prev) => (prev || []).map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    } catch (e) {
      Alert.alert("Xəta", e.message || "Alınmadı");
    }
  }

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>Bildirişlər</Text>
          <Text style={styles.sub}>{unreadCount ? `${unreadCount} oxunmamış` : "Hamısı oxunub"}</Text>
        </View>

        <Pressable onPress={markAllRead} style={styles.actionBtn}>
          <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Card>
            <Text style={{ color: Colors.muted, fontWeight: "800" }}>Bildiriş yoxdur.</Text>
          </Card>
        }
        renderItem={({ item }) => {
          const unread = !item.read_at;
          return (
            <Pressable onPress={() => openItem(item)} style={{ marginBottom: 12 }}>
              <View style={[styles.row, unread ? styles.rowUnread : null]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="notifications" size={18} color={unread ? Colors.primary : Colors.muted} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.ntitle, unread ? null : styles.ntitleRead]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.nbody} numberOfLines={3}>
                    {item.body}
                  </Text>
                  <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                </View>

                {unread ? <View style={styles.dot} /> : null}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 3, color: Colors.muted, fontWeight: "800", fontSize: 12 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  backText: { color: Colors.primary, fontWeight: "900" },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  row: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  rowUnread: {
    borderColor: Colors.primary,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  ntitle: { color: Colors.text, fontWeight: "900", fontSize: 14 },
  ntitleRead: { color: Colors.muted },
  nbody: { marginTop: 6, color: Colors.text, lineHeight: 18 },
  time: { marginTop: 8, color: Colors.muted, fontWeight: "800", fontSize: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
