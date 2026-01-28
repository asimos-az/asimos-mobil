import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MapPreview } from "../../components/MapPreview";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

export function JobDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeJob = route.params?.job;
  const { user } = useAuth();

  const [job, setJob] = useState(routeJob || null);
  const [saving, setSaving] = useState(false);

  // Always refresh from server when opened from push or older list item
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!routeJob?.id) return;
        const fresh = await api.getJobById(routeJob.id);
        if (alive && fresh) setJob(fresh);
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, [routeJob?.id]);

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

  const jobLoc = job?.location || null;
  const userLoc = user?.location || null;

  const jt = (job.jobType || job.job_type || (job.isDaily ? "temporary" : null));
  const isTemporary = jt === "temporary";
  const isPermanent = jt === "permanent";
  const durationDays = (job.durationDays ?? job.duration_days ?? null);

  const status = (job.status || job.jobStatus || "open").toLowerCase();
  const isOwnerEmployer = useMemo(() => {
    return user?.role === "employer" && !!job?.createdBy && job.createdBy === user?.id;
  }, [user?.role, user?.id, job?.createdBy]);

  async function closeJob() {
    Alert.alert(
      "Elanı bağla",
      "İşi tapdınsa elan bağlana bilər. Bağlandıqdan sonra iş axtaranlara görünməyəcək.",
      [
        { text: "Ləğv et", style: "cancel" },
        {
          text: "Bağla",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              const updated = await api.closeJob(job.id, { reason: "filled" });
              if (updated) setJob(updated);
            } catch (e) {
              Alert.alert("Xəta", e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  async function reopenJob() {
    Alert.alert(
      "Elanı yenidən aç",
      "Elanı yenidən aktiv etmək istəyirsən?", 
      [
        { text: "Ləğv et", style: "cancel" },
        {
          text: "Aç",
          onPress: async () => {
            try {
              setSaving(true);
              const updated = await api.reopenJob(job.id);
              if (updated) setJob(updated);
            } catch (e) {
              Alert.alert("Xəta", e.message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
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
            {isTemporary ? (
              <Text style={[styles.badge, styles.badgeTemp]}>Müvəqqəti</Text>
            ) : isPermanent ? (
              <Text style={styles.badge}>Daimi</Text>
            ) : null}
          </View>

          {isOwnerEmployer ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.meta}>Status: {status === "closed" ? "Bağlı" : "Aktiv"}</Text>
              <View style={styles.actions}>
                {status === "closed" ? (
                  <Pressable onPress={reopenJob} disabled={saving} style={[styles.actionBtn, styles.actionBtnPrimary, saving && { opacity: 0.6 }]}>
                    <Text style={styles.actionBtnText}>Yenidən aç</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={closeJob} disabled={saving} style={[styles.actionBtn, styles.actionBtnDanger, saving && { opacity: 0.6 }]}>
                    <Text style={[styles.actionBtnText, { color: "#fff" }]}>Elanı bağla</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : null}

          {job.category ? <Text style={styles.meta}>Kateqoriya: {job.category}</Text> : null}
          {job.wage ? <Text style={styles.meta}>Maaş: {job.wage}</Text> : null}
          {isTemporary && durationDays ? <Text style={styles.meta}>Müddət: {durationDays} gün</Text> : null}
          {job.whatsapp ? (
            <Pressable
              onPress={() => {
                const raw = String(job.whatsapp || "").replace(/\s+/g, "");
                const digits = raw.replace(/[^+0-9]/g, "");
                const num = digits.startsWith("+") ? digits.slice(1) : digits;
                const url = `https://wa.me/${num}`;
                Linking.openURL(url).catch(() => {});
              }}
              style={styles.contactRow}
            >
              <Ionicons name="logo-whatsapp" size={18} color={Colors.text} />
              <Text style={styles.contactText}>{job.whatsapp}</Text>
            </Pressable>
          ) : null}

          {job.phone ? (
            <Pressable
              onPress={() => {
                const raw = String(job.phone || "").replace(/\s+/g, "");
                Linking.openURL(`tel:${raw}`).catch(() => {});
              }}
              style={styles.contactRow}
            >
              <Ionicons name="call" size={18} color={Colors.text} />
              <Text style={styles.contactText}>{job.phone}</Text>
            </Pressable>
          ) : null}

          {job.link ? (
            <Pressable
              onPress={() => {
                let url = String(job.link || "").trim();
                if (!url) return;
                if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
                Linking.openURL(url).catch(() => {});
              }}
              style={styles.contactRow}
            >
              <Ionicons name="link" size={18} color={Colors.text} />
              <Text style={styles.contactText}>{job.link}</Text>
            </Pressable>
          ) : null}

          {job.voen ? <Text style={styles.meta}>VOEN: {job.voen}</Text> : null}
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

  contactRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  contactText: { color: Colors.text, fontWeight: '900' },

  actions: { marginTop: 10, flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.border,
  },
  actionBtnDanger: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  actionBtnText: { fontWeight: "900", color: Colors.text },

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
