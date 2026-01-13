import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";
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

  return (
    <SafeScreen>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Satıcı paneli</Text>
          <Text style={styles.sub}>Əlavə etdiyim elanlar</Text>
        </View>
        <Ionicons name="briefcase-outline" size={22} color={Colors.muted} />
      </View>

      <View style={styles.body}>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Hələ elan yoxdur. Aşağıdakı “+” ilə yeni elan yarat.</Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => navigation.navigate("JobDetail", { job: item })}>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  {item.isDaily ? <Text style={styles.badge}>Gündəlik</Text> : null}
                </View>
                {item.category ? <Text style={styles.jobMeta}>Kateqoriya: {item.category}</Text> : null}
                <Text style={styles.jobMeta}>{item.wage || "—"}</Text>
                <Text style={styles.jobDesc} numberOfLines={3}>{item.description}</Text>
                {item.location?.address ? <Text style={styles.jobLoc} numberOfLines={2}>📍 {item.location.address}</Text> : null}
                {typeof item.notifyRadiusM === "number" ? (
                  <Text style={styles.jobLoc}>📣 Bildiriş radiusu: {item.notifyRadiusM} m</Text>
                ) : null}
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

  body: { flex: 1, padding: 16 },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: { backgroundColor: Colors.primarySoft, color: Colors.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, fontWeight: "900" },

  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  jobMeta: { marginTop: 6, color: Colors.muted, fontWeight: "800" },
  jobDesc: { marginTop: 8, color: Colors.text, lineHeight: 20 },
  jobLoc: { marginTop: 10, color: Colors.muted, fontWeight: "800" },
});
