import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MapPreview } from "../../components/MapPreview";
import { useAuth } from "../../context/AuthContext";

export function JobDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const job = route.params?.job;
  const { user } = useAuth();

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

  const jobLoc = job.location || null;
  const userLoc = user?.location || null;

  const jt = (job.jobType || job.job_type || (job.isDaily ? "temporary" : null));
  const isTemporary = jt === "temporary";
  const isPermanent = jt === "permanent";
  const durationDays = (job.durationDays ?? job.duration_days ?? null);

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
            {isTemporary ? (
              <Text style={[styles.badge, styles.badgeTemp]}>Müvəqqəti</Text>
            ) : isPermanent ? (
              <Text style={styles.badge}>Daimi</Text>
            ) : null}
          </View>

          {job.category ? <Text style={styles.meta}>Kateqoriya: {job.category}</Text> : null}
          {job.wage ? <Text style={styles.meta}>Maaş: {job.wage}</Text> : null}
          {isTemporary && durationDays ? <Text style={styles.meta}>Müddət: {durationDays} gün</Text> : null}
          {job.whatsapp ? <Text style={styles.meta}>WhatsApp: {job.whatsapp}</Text> : null}
          {jobLoc?.address ? <Text style={styles.meta}>📍 {jobLoc.address}</Text> : null}

          {typeof job.distanceM === "number" ? <Text style={styles.meta}>Sənə məsafə: {job.distanceM} m</Text> : null}

          <View style={{ height: 14 }} />
          <Text style={styles.descTitle}>Xəritə</Text>
          <Text style={styles.mapHint}>Yaşıl: elanın lokasiyası • Mavi: sənin lokasiyan</Text>
          <View style={{ height: 10 }} />
          <MapPreview userLocation={userLoc} jobLocation={jobLoc} height={240} />

          <View style={{ height: 14 }} />
          <Text style={styles.descTitle}>Təsvir</Text>
          <Text style={styles.desc}>{job.description}</Text>
          {user?.role === "seeker" && isTemporary ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                📌 Müvəqqəti işlər yalnız göstərilən gün sayı üçün etibarlıdır.{"\n"}
                Müddəti bitmiş elanlar sistem tərəfindən avtomatik silinir.
              </Text>
            </View>
          ) : null}
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

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  badge: {
    backgroundColor: Colors.primarySoft,
    color: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontWeight: "900",
  },
  badgeTemp: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
  },

  jobTitle: { fontSize: 18, fontWeight: "900", color: Colors.text },
  meta: { marginTop: 8, color: Colors.muted, fontWeight: "800" },

  descTitle: { color: Colors.text, fontWeight: "900" },
  desc: { marginTop: 6, color: Colors.text, lineHeight: 20 },
  mapHint: { marginTop: 6, color: Colors.muted, fontWeight: "700", fontSize: 12 },

  noteBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    color: Colors.text,
    fontWeight: "800",
    lineHeight: 18,
    fontSize: 12,
  },
});
