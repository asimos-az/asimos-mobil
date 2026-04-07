import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { EmployerJobCard } from "../../components/EmployerJobCard";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { SegmentedControl } from "../../components/SegmentedControl";

export function EmployerJobsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("my");
  const [allJobs, setAllJobs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [statusTab, setStatusTab] = useState("open");

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const s = String(it?.status || "").toLowerCase();
      if (statusTab === "pending") return s === "pending" || s === "scheduled";
      return s === statusTab;
    });
  }, [items, statusTab]);

  async function load() {
    try {
      setLoading(true);
      // Trigger server-side activation of due scheduled jobs before fetching.
      await api.activateDueJobs().catch(() => {});
      const data = await api.listMyJobs(user.id);
      setItems(data);
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    try {
      setLoadingAll(true);
      const data = await api.listJobsWithSearch({ q: "" });
      setAllJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    if (tab === "all") {
      loadAll();
    }
  }, [tab]);

  useEffect(() => {
    let interval = null;
    if (isFocused) {
      load();
      if (tab === "all") loadAll();
      
      interval = setInterval(() => {
        load();
        if (tab === "all") loadAll();
      }, 15000); // 15 seconds polling
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isFocused, tab]);

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
              setStatusTab("open");
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
              setStatusTab("closed");
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
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerNotifications");
    else navigation.navigate("EmployerNotifications");
  }

  function goMap() {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate("EmployerMap");
    else navigation.navigate("EmployerMap");
  }

  const renderMyJobs = () => (
    <>
      <View style={{ marginBottom: 16 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: "Aktiv", value: "open" },
            { label: "Gözləyən", value: "pending" },
            { label: "Rədd edilib", value: "rejected" },
            { label: "Deaktiv", value: "closed" },
          ]}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setStatusTab(item.value)}
              style={[
                styles.statusTab,
                statusTab === item.value && styles.statusTabActive,
              ]}
            >
              <Text
                style={[
                  styles.statusTabText,
                  statusTab === item.value && styles.statusTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
          keyExtractor={(it) => it.value}
          contentContainerStyle={{ gap: 8 }}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(it) => it.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {statusTab === "open" && "Aktiv elanınız yoxdur."}
            {statusTab === "pending" && "Yoxlanılan və planlı elanınız yoxdur."}
            {statusTab === "rejected" && "Rədd edilmiş elanınız yoxdur."}
            {statusTab === "closed" && "Deaktiv elanınız yoxdur."}
          </Text>
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
    </>
  );

  const renderAllJobs = () => (
    <FlatList
      data={allJobs}
      keyExtractor={(it) => it.id}
      refreshing={loadingAll}
      onRefresh={loadAll}
      contentContainerStyle={{ paddingBottom: 120 }}
      ListEmptyComponent={
        <Text style={styles.empty}>Hələ heç bir elan yoxdur.</Text>
      }
      renderItem={({ item }) => (
        <EmployerJobCard
          job={item}
          onPress={() => navigation.navigate("JobDetail", { job: item })}
          readonly={true}
        />
      )}
    />
  );

  return (
    <SafeScreen>
      <View style={styles.body}>
        <View style={{ marginBottom: 16 }}>
          <SegmentedControl
            options={[{ label: "Mənim elanlarım", value: "my" }, { label: "Bütün elanlar", value: "all" }]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === "my" ? renderMyJobs() : renderAllJobs()}
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: 16 },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statusTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  statusTabTextActive: {
    color: "#fff",
  },

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
