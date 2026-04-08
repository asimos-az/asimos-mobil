import React, { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MapPreview } from "../../components/MapPreview";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { RateUserModal } from "../../components/RateUserModal";
import { useToast } from "../../context/ToastContext";
import { getDeviceLocationOrNull } from "../../utils/deviceLocation";

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function getDistanceKM(loc1, loc2) {
  const l1Lat = loc1?.lat;
  const l1Lng = loc1?.lng || loc1?.lon;
  const l2Lat = loc2?.lat;
  const l2Lng = loc2?.lng || loc2?.lon;

  if (!l1Lat || !l1Lng || !l2Lat || !l2Lng) return null;

  const R = 6371; // km
  const dLat = (l2Lat - l1Lat) * Math.PI / 180;
  const dLon = (l2Lng - l1Lng) * Math.PI / 180;
  const lat1 = (l1Lat) * Math.PI / 180;
  const lat2 = (l2Lat) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export function JobDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const routeJob = route.params?.job;
  const { user } = useAuth();
  const isAuthed = !!user;

  const [job, setJob] = useState(routeJob || null);
  const [saving, setSaving] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [myLoc, setMyLoc] = useState(null);
  const toast = useToast();

  useEffect(() => {
    getDeviceLocationOrNull({ timeoutMs: 5000 }).then(loc => {
      if (loc) setMyLoc(loc);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!routeJob?.id) return;
        const fresh = await api.getJobById(routeJob.id);
        if (alive && fresh) setJob(fresh);
      } catch {
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
  const currentLoc = myLoc || userLoc;

  const distanceKM = useMemo(() => getDistanceKM(currentLoc, jobLoc), [currentLoc, jobLoc]);
  const distanceDisplay = useMemo(() => {
    if (distanceKM === null) return null;
    if (distanceKM < 1) return `${(distanceKM * 1000).toFixed(0)} metr`;
    return `${distanceKM.toFixed(1)} km`;
  }, [distanceKM]);

  const jt = (job.jobType || job.job_type || (job.isDaily ? "temporary" : null));
  const isTemporary = jt === "temporary";
  const isPermanent = jt === "permanent";
  const durationDays = (job.durationDays ?? job.duration_days ?? null);
  const publishDate = job?.publishedAt || job?.published_at || job?.created_at || job?.createdAt;
  const dateDisplay = formatDate(publishDate);
  const rawWage = job?.wage ? String(job.wage).replace(/AZN|₼/gi, "").trim() : null;
  const ownerId = job?.createdBy || job?.created_by;

  const status = (job.status || job.jobStatus || "open").toLowerCase();
  const isOwnerEmployer = useMemo(() => {
    return user?.role === "employer" && !!ownerId && ownerId === user?.id;
  }, [user?.role, user?.id, ownerId]);
  const isOwnerSeeker = useMemo(() => {
    return user?.role === "seeker" && !!ownerId && ownerId === user?.id;
  }, [user?.role, user?.id, ownerId]);

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
              if (updated) {
                setJob(updated);
                toast.show("Elan bağlandı", "success");
              }
            } catch (e) {
              toast.show(e.message, "error");
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
              if (updated) {
                setJob(updated);
                toast.show("Elan aktiv edildi", "success");
              }
            } catch (e) {
              toast.show(e.message, "error");
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
        {isOwnerSeeker ? (
          <Pressable
            onPress={() => navigation.navigate("SeekerCreateAd", { job })}
            style={styles.editHeadBtn}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </Pressable>
        ) : <View style={{ width: 60 }} />}
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
              <Text style={styles.meta}>Status: {
                status === "pending" ? "Gözləyir (Yoxlanışda)" :
                  status === "scheduled" ? "Planlı (Tarix/Saat gözlənir)" :
                  status === "closed" ? "Bağlı" :
                    "Aktiv"
              }</Text>
              <View style={styles.actions}>
                {status === "pending" || status === "scheduled" ? (
                  <View style={[styles.actionBtn, { borderColor: "#F59E0B", backgroundColor: "#FEF3C7" }]}>
                    <Text style={[styles.actionBtnText, { color: "#D97706" }]}>{status === "scheduled" ? "Yayım vaxtını gözləyir" : "Moderasiya gözləyir"}</Text>
                  </View>
                ) : status === "closed" ? (
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

          {isOwnerSeeker ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.meta}>Status: {
                status === "pending" ? "Gözləyir (Yoxlanışda)" :
                  status === "scheduled" ? "Planlı (Tarix/Saat gözlənir)" :
                    status === "closed" ? "Bağlı" :
                      "Aktiv"
              }</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => navigation.navigate("SeekerCreateAd", { job })}
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="create-outline" size={16} color={Colors.text} />
                    <Text style={styles.actionBtnText}>Elanı redaktə et</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          ) : null}

          {dateDisplay ? <Text style={styles.meta}>{job?.publishedAt || job?.published_at ? "Planlanan yayım vaxtı" : "Paylaşılma tarixi"}: {dateDisplay}</Text> : null}
          {(job.company_name || job.companyName) ? <Text style={styles.meta}>Şirkət/Obyekt: {job.company_name || job.companyName}</Text> : null}
          {job.category ? <Text style={styles.meta}>Kateqoriya: {job.category}</Text> : null}
          {rawWage ? (
            <Text style={styles.meta}>
              Maaş: <Text style={{ fontWeight: "900", color: "#111827" }}>{rawWage} <Text style={{ fontSize: 11, color: "#6B7280" }}>AZN</Text></Text>
            </Text>
          ) : null}
          {isTemporary && durationDays ? <Text style={styles.meta}>Müddət: {durationDays} gün</Text> : null}
          {(job.start_time && job.end_time) ? <Text style={styles.meta}>İş qrafiki: {job.start_time} - {job.end_time}</Text> : null}


          {/* Contact info is gated for guests */}
          {(job.whatsapp || job.phone || job.link) ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.descTitle}>Əlaqə</Text>
              {!isAuthed ? (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Qeydiyyat tələb olunur",
                      "WhatsApp, əlaqə nömrəsi və linki görmək üçün qeydiyyatdan keçin və ya daxil olun.",
                      [
                        { text: "Ləğv", style: "cancel" },
                        {
                          text: "Qeydiyyat / Login",
                          onPress: () => {
                            navigation.navigate("AuthEntry", {
                              redirect: { screen: "JobDetail", params: { job } },
                            });
                          },
                        },
                      ]
                    );
                  }}
                  style={[styles.contactRow, styles.lockRow]}
                >
                  <Ionicons name="lock-closed" size={18} color={Colors.primary} />
                  <Text style={[styles.contactText, { color: Colors.primary, fontWeight: "900" }]}
                  >Əlaqə məlumatlarını gör</Text>
                  <View style={{ flex: 1 }} />
                  <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                </Pressable>
              ) : (
                <>
                  {job.whatsapp ? (
                    <Pressable
                      onPress={() => {
                        const raw = String(job.whatsapp || "").replace(/\s+/g, "");
                        const digits = raw.replace(/[^+0-9]/g, "");
                        const num = digits.startsWith("+") ? digits.slice(1) : digits;
                        const url = `https://wa.me/${num}`;
                        Linking.openURL(url).catch(() => { });
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
                        Linking.openURL(`tel:${raw}`).catch(() => { });
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
                        Linking.openURL(url).catch(() => { });
                      }}
                      style={styles.contactRow}
                    >
                      <Ionicons name="link" size={18} color={Colors.text} />
                      <Text style={styles.contactText}>{job.link}</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          ) : null}

          {job.voen ? <Text style={styles.meta}>VOEN: {job.voen}</Text> : null}
          {distanceDisplay ? <Text style={styles.meta}>Səndən məsafə: <Text style={{fontWeight: "900", color: "#111827"}}>{distanceDisplay}</Text></Text> : null}
          {jobLoc?.address ? <Text style={styles.meta}>📍 {jobLoc.address}</Text> : null}

          <View style={{ height: 14 }} />
          <Text style={styles.descTitle}>Xəritə</Text>
          <Text style={styles.mapHint}>Yaşıl: elanın lokasiyası • Mavi: sənin lokasiyan • Böyütmək üçün xəritəyə toxun</Text>
          <View style={{ height: 10 }} />

          <View style={{ position: 'relative' }}>
            <MapPreview 
              userLocation={myLoc || userLoc} 
              jobLocation={jobLoc} 
              height={240} 
              jobTitle={job.title}
              jobAddress={jobLoc?.address || ""}
              jobWage={rawWage ? `${rawWage} AZN` : "Razılaşma ilə"}
            />
            <Pressable 
              onPress={() => navigation.navigate("JobMap", { job, userLocation: myLoc || userLoc })}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
            />
          </View>

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

          {/* Rate Employer Button */}
          {user?.role === "seeker" && job.createdBy ? (
            <View style={{ marginTop: 24 }}>
              <Pressable onPress={() => setRateModalOpen(true)} style={styles.rateBtn}>
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.rateBtnText}>İşəgötürəni qiymətləndir</Text>
              </Pressable>
            </View>
          ) : null}

        </Card>
      </ScrollView>

      <RateUserModal
        visible={rateModalOpen}
        onClose={() => setRateModalOpen(false)}
        targetId={job.createdBy}
        jobId={job.id}
        onSuccess={() => toast.show("Qiymətləndirmə üçün təşəkkürlər!", "success")}
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
  editHeadBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

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
  lockRow: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
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
  rateBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rateBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
