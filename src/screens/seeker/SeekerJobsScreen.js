import React, { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";

export function SeekerJobsScreen() {
  const { signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const data = await api.listJobs();
      setItems(data);
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeScreen>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Elanlar</Text>
          <Text style={styles.sub}>İş axtaran (Alıcı)</Text>
        </View>
        <Pressable onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Çıxış</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobMeta}>{item.wage || "—"}</Text>
              <Text style={styles.jobDesc}>{item.description}</Text>
              {item.location?.address ? <Text style={styles.jobLoc}>📍 {item.location.address}</Text> : null}
            </Card>
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
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.primarySoft },
  logoutText: { color: Colors.primary, fontWeight: "900" },

  body: { flex: 1, padding: 16 },
  jobTitle: { fontSize: 16, fontWeight: "900", color: Colors.text },
  jobMeta: { marginTop: 6, color: Colors.muted, fontWeight: "800" },
  jobDesc: { marginTop: 8, color: Colors.text, lineHeight: 20 },
  jobLoc: { marginTop: 10, color: Colors.muted, fontWeight: "800" },
});
