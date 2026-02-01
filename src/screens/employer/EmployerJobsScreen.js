import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { EmployerJobCard } from "../../components/EmployerJobCard";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function EmployerJobsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await api.listMyJobs(user.id);
      setItems(data);
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    load();
    return unsub;
  }, [navigation]);

  const statusLabel = useMemo(
    () => ({
      open: { text: "Aktiv", dot: "#16A34A", chipBg: "#E9FBEF", chipText: "#0E7A37" },
      pending: { text: "Gözləyir", dot: "#F59E0B", chipBg: "#FEF3C7", chipText: "#D97706" }, // Yellow/Orange
      closed: { text: "Bağlı", dot: "#DC2626", chipBg: "#FFECEC", chipText: "#B91C1C" },
    }),
    []
  );

  async function toggleJob(item) {
    const isClosed = String(item?.status || "open").toLowerCase() === "closed";

    if (isClosed) {
      Alert.alert("Elanı yenidən aç", "Bu elanı yenidən aktiv etmək istəyirsən?", [
        { text: "Ləğv et", style: "cancel" },
        {
          text: "Yenidən aç",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);
              await api.reopenJob(item.id);
              await load();
            } catch (e) {
              Alert.alert("Xəta", e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
      return;
    }

    Alert.alert(
      "Elanı bağla",
      "İşçi tapmısansa elanı bağlaya bilərsən. Bağlandıqdan sonra iş axtaranlara görünməyəcək.",
      [
        { text: "Ləğv et", style: "cancel" },
        {
          text: "Bağla",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.closeJob(item.id, { reason: "filled" });
              await load();
            } catch (e) {
              Alert.alert("Xəta", e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  function goNotifications() {
    // Tab navigator içindən Root Stack screen-ə çıxmaq üçün parent-ə yönləndir.
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerNotifications");
    else navigation.navigate("EmployerNotifications");
  }

  function goMap() {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerMap");
    else navigation.navigate("EmployerMap");
  }

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable onPress={goNotifications} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>İşçi axtaran paneli</Text>
          <Text style={styles.sub}>Əlavə etdiyim elanlar</Text>
        </View>

        <Pressable
          onPress={goMap}
          style={styles.iconBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Xəritə"
        >
          <Ionicons name="map-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Hələ elan yoxdur. Aşağıdakı “+” ilə yeni elan yarat.</Text>
          }
          renderItem={({ item }) => (
            <EmployerJobCard
              job={item}
              onPress={() => navigation.navigate("JobDetail", { job: item })}
              onToggleStatus={toggleJob}
              loading={loading}
            />
          )}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
  },
  titleWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 4, color: Colors.muted, fontWeight: "800" },

  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  body: { flex: 1, padding: 16 },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },

  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.primarySoft,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 10 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
  },
  pillText: { fontWeight: "900", color: Colors.primary, fontSize: 12 },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  actionBtnClose: { borderColor: "#F5C2C2", backgroundColor: "#FFF5F5" },
  actionBtnReopen: { borderColor: "#BFEACB", backgroundColor: "#F1FFF6" },
  actionText: { fontWeight: "900", fontSize: 12 },

  cardBody: { padding: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    maxWidth: "100%",
  },
  chipCategory: { backgroundColor: Colors.primarySoft },
  chipText: { fontWeight: "900", fontSize: 12 },

  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 10 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 90 },
  infoText: { color: Colors.muted, fontWeight: "900" },

  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text, flex: 1 },
  jobDesc: { marginTop: 10, color: Colors.text, lineHeight: 20 },
});
