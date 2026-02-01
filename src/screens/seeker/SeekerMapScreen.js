import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, DeviceEventEmitter, ScrollView, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../../components/NotificationBell";

const RADIUS_PRESETS = [
  { label: "Ölkə üzrə", value: 0 },
  { label: "1km", value: 1000 },
  { label: "5km", value: 5000 },
  { label: "10km", value: 10000 },
];

function safeJson(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function SeekerMapScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [unread, setUnread] = useState(0);

  const [radius, setRadius] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const didInit = useRef(false);
  const userLoc = user?.location || null;

  useFocusEffect(
    React.useCallback(() => {
      api.getUnreadNotificationsCount()
        .then((r) => setUnread(r?.unread || 0))
        .catch(() => { });
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("asimos:pushReceived", () => {
      api.getUnreadNotificationsCount().then((r) => setUnread(r?.unread || 0)).catch(() => { });
    });
    return () => sub?.remove?.();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await api.listJobsWithSearch({
        q: "",
        lat: userLoc?.lat,
        lng: userLoc?.lng,
        radius_m: (radius > 0 && userLoc?.lat && userLoc?.lng) ? radius : undefined,
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
    if (!didInit.current) {
      didInit.current = true;
      load();
    } else {
      load();
    }
  }, [userLoc?.lat, userLoc?.lng]);

  useEffect(() => {
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
    .leaflet-bar { border:none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px; overflow:hidden; }
    .leaflet-bar a { background: #fff; color: #111827; border-bottom: 1px solid #f3f4f6; }
    .leaflet-bar a:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const DATA = ${dataJson};
    const u = DATA.user;
    const jobs = DATA.jobs || [];

    const map = L.map('map', { zoomControl: false }).setView([u.lat, u.lng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    const bounds = [];

    const userIcon = L.divIcon({
      className: 'user-dot',
      html: '<div style="width:16px;height:16px;border-radius:999px;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.2)"></div>',
      iconSize: [16,16],
      iconAnchor: [8,8]
    });
    
    // Custom SVG Pin for jobs
    const pinSvg = '<svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 20 12 32 12 32C12 32 24 20 24 12C24 5.37258 18.6274 0 12 0ZM12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="#1d4ed8"/></svg>';

    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="transform:translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">' + pinSvg + '</div>',
      iconSize: [24,32],
      iconAnchor: [12,32],
      popupAnchor: [0, -36]
    });

    const um = L.marker([u.lat, u.lng], { icon: userIcon }).addTo(map);
    // um.bindPopup('Sənin lokasiyan');
    bounds.push([u.lat, u.lng]);

    jobs.forEach((j) => {
      const lat = j.location && Number(j.location.lat);
      const lng = j.location && Number(j.location.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], { icon: jobIcon }).addTo(map);
      const cat = j.category ? ('<div style="margin-top:2px;color:#6b7280;font-weight:600;font-size:12px">' + j.category + '</div>') : '';
      const wage = j.wage ? ('<div style="margin-top:4px;color:#111827;font-weight:800;font-size:14px">' + j.wage + '</div>') : '';
      
      marker.bindPopup('<div style="padding:4px;min-width:140px"><div style="font-weight:800;font-size:15px;color:#111827;margin-bottom:2px">' + (j.title || 'Elan') + '</div>' + cat + wage + '<div style="margin-top:8px;color:#2563eb;font-weight:700;font-size:13px">Detallara bax →</div></div>');
      marker.on('click', () => {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'job', payload: j }));
        } catch (e) {}
      });
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      if (bounds.length === 1) map.setView(bounds[0], 14);
      else map.fitBounds(bounds, { padding: [60, 60] });
    } else {
      map.setView([u.lat, u.lng], 13);
    }
  </script>
</body>
</html>`;
  }, [items, userLoc?.lat, userLoc?.lng]);

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === "job" && msg?.payload) {
              navigation.navigate("JobDetail", { job: msg.payload });
            }
          } catch { }
        }}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.text} />
            <Text style={styles.searchText}>Xəritədə elan axtar...</Text>
          </View>
          <NotificationBell
            count={unread}
            onPress={() => {
              if (!user) {
                Alert.alert("Giriş", "Bildirişlər üçün daxil olun.", [{ text: "OK" }]);
                return;
              }
              navigation.navigate("SeekerNotifications");
            }}
            style={styles.bellBtn}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={{ flexGrow: 0 }}
        >
          {RADIUS_PRESETS.map((p) => {
            const isActive = radius === p.value;
            return (
              <Pressable
                key={p.value}
                onPress={() => setRadius(p.value)}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Pressable onPress={load} style={[styles.refreshBtn, { bottom: 30 + insets.bottom }]}>
        <Ionicons name={loading ? "time-outline" : "navigate-outline"} size={24} color={Colors.text} />
        <Text style={styles.refreshText}>{loading ? "Yüklənir..." : "Siyahını yenilə"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    // pointerEvents: "box-none", // Android-də bəzən problem yaradır, amma overlay view-dur.
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchText: { fontSize: 15, fontWeight: "700", color: Colors.text },
  bellBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  chipsScroll: { gap: 10, paddingBottom: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.text },
  chipText: { fontSize: 13, fontWeight: "800", color: Colors.text },
  chipTextActive: { color: "#fff" },

  refreshBtn: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  refreshText: { fontSize: 14, fontWeight: "900", color: Colors.text },
});
