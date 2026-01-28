import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, DeviceEventEmitter } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { SafeScreen } from "../../components/SafeScreen";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../../components/NotificationBell";

const RADIUS_PRESETS = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "1.2km", value: 1200 },
  { label: "2km", value: 2000 },
];

function safeJson(obj) {
  // Prevent HTML injection from job text
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function SeekerMapScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [unread, setUnread] = useState(0);

  const [radius, setRadius] = useState(1200);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const didInit = useRef(false);

  const userLoc = user?.location || null;

  useFocusEffect(
    React.useCallback(() => {
      api.getUnreadNotificationsCount()
        .then((r) => setUnread(r?.unread || 0))
        .catch(() => {});
    }, [])
  );

  // Refresh unread count immediately when a push arrives
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => {});
    });
    return () => sub?.remove?.();
  }, []);

  async function load() {
    try {
      if (!userLoc?.lat || !userLoc?.lng) return;
      setLoading(true);
      const data = await api.listJobsWithSearch({
        q: "",
        lat: userLoc.lat,
        lng: userLoc.lng,
        radius_m: radius,
        daily: undefined,
      });
      setItems(data || []);
    } catch (e) {
      Alert.alert("Xəta", e.message || "Yükləmə xətası");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!userLoc?.lat || !userLoc?.lng) return;
    if (!didInit.current) {
      didInit.current = true;
      load();
    }
  }, [userLoc?.lat, userLoc?.lng]);

  useEffect(() => {
    // radius dəyişəndə yenilə
    if (!didInit.current) return;
    load();
  }, [radius]);

  const html = useMemo(() => {
    const u = userLoc || {};
    const jobs = (items || []).filter((j) => j?.location?.lat && j?.location?.lng);

    const payload = {
      user: { lat: Number(u.lat || 40.4093), lng: Number(u.lng || 49.8671) },
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        wage: j.wage,
        description: j.description,
        isDaily: j.isDaily,
        distanceM: j.distanceM,
        location: j.location,
      })),
    };

    const dataJson = safeJson(payload);

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
    #map{height:100%;width:100%}
    .tag{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:#1d4ed8;font-weight:900;font-size:12px}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const DATA = ${dataJson};
    const u = DATA.user;
    const jobs = DATA.jobs || [];

    const map = L.map('map', { zoomControl: true }).setView([u.lat, u.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const bounds = [];

    const userIcon = L.divIcon({
      className: 'user-dot',
      html: '<div style="width:14px;height:14px;border-radius:999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.18)"></div>',
      iconSize: [14,14],
      iconAnchor: [7,7]
    });
    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="width:18px;height:18px;border-radius:999px;background:#16a34a;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.18)"></div>',
      iconSize: [18,18],
      iconAnchor: [9,9]
    });

    const um = L.marker([u.lat, u.lng], { icon: userIcon }).addTo(map);
    um.bindPopup('Sənin lokasiyan');
    bounds.push([u.lat, u.lng]);

    jobs.forEach((j) => {
      const lat = j.location && Number(j.location.lat);
      const lng = j.location && Number(j.location.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], { icon: jobIcon }).addTo(map);
      const cat = j.category ? ('<div style="margin-top:6px;color:#6b7280;font-weight:800">' + j.category + '</div>') : '';
      const wage = j.wage ? ('<div style="margin-top:4px;color:#111827;font-weight:900">' + j.wage + '</div>') : '';
      const dist = (typeof j.distanceM === 'number') ? ('<div style="margin-top:6px"><span class="tag">' + j.distanceM + ' m</span></div>') : '';
      marker.bindPopup('<div style="font-weight:900;font-size:14px;color:#111827">' + (j.title || 'Elan') + '</div>' + cat + wage + dist + '<div style="margin-top:10px;color:#1d4ed8;font-weight:900">Detallara bax</div>');
      marker.on('click', () => {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'job', payload: j }));
        } catch (e) {}
      });
      bounds.push([lat, lng]);
    });

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      map.setView([u.lat, u.lng], 13);
    }
  </script>
</body>
</html>`;
  }, [items, userLoc?.lat, userLoc?.lng]);

  const radiusOptions = useMemo(() => RADIUS_PRESETS.map((x) => ({ label: x.label, value: x.value })), []);

  return (
    <SafeScreen>
      <View style={styles.top}>
        <View>
          <Text style={styles.title}>Xəritə</Text>
          <Text style={styles.sub}>Elanlar marker kimi (radius: {radius}m)</Text>
        </View>

        <View style={styles.actions}>
          <NotificationBell count={unread} onPress={() => navigation.navigate("SeekerNotifications")} />

          <Pressable onPress={load} style={styles.iconBtn}>
            <Ionicons name={loading ? "time-outline" : "refresh"} size={22} color={Colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <SegmentedControl options={radiusOptions} value={radius} onChange={setRadius} />
      </View>

      <View style={styles.mapWrap}>
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg?.type === "job" && msg?.payload) {
                navigation.navigate("JobDetail", { job: msg.payload });
              }
            } catch {}
          }}
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
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: { padding: 16 },
  mapWrap: { flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
});
