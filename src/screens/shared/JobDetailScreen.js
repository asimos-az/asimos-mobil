import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

export function JobDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const job = route.params?.job;

  if (!job) {
    return (
      <SafeScreen>
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            <Text style={styles.backText}>Geri</Text>
          </Pressable>
          <Text style={styles.title}>Elan</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ padding: 16 }}>
          <Text style={{ color: Colors.muted, fontWeight: "800" }}>Məlumat tapılmadı.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Geri</Text>
        </Pressable>
        <Text style={styles.title}>Detallar</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <Card>
          <View style={styles.row}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            {job.isDaily ? <Text style={styles.badge}>Gündəlik</Text> : null}
          </View>

          {job.category ? <Text style={styles.meta}>Kateqoriya: {job.category}</Text> : null}
          {job.wage ? <Text style={styles.meta}>Maaş: {job.wage}</Text> : null}
          {job.whatsapp ? <Text style={styles.meta}>WhatsApp: {job.whatsapp}</Text> : null}
          {job.location?.address ? <Text style={styles.meta}>📍 {job.location.address}</Text> : null}

          {typeof job.distanceM === "number" ? (
            <Text style={styles.meta}>Sənə məsafə: {job.distanceM} m</Text>
          ) : null}

          {typeof job.notifyRadiusM === "number" ? (
            <Text style={styles.meta}>Bildiriş radiusu: {job.notifyRadiusM} m</Text>
          ) : null}

          <View style={{ height: 12 }} />
          <Text style={styles.descTitle}>Təsvir</Text>
          <Text style={styles.desc}>{job.description}</Text>
        </Card>
      </ScrollView>
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
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: Colors.primarySoft },
  backText: { color: Colors.primary, fontWeight: "900" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: { backgroundColor: Colors.primarySoft, color: Colors.primary, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, fontWeight: "900" },

  jobTitle: { fontSize: 18, fontWeight: "900", color: Colors.text },
  meta: { marginTop: 8, color: Colors.muted, fontWeight: "800" },

  descTitle: { color: Colors.text, fontWeight: "900", marginBottom: 6 },
  desc: { color: Colors.text, lineHeight: 20 },
});
