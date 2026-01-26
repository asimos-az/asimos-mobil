import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { SafeScreen } from "../../components/SafeScreen";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const RADIUS_PRESETS = [
  { label: "500m", value: 500 },
  { label: "1km", value: 1000 },
  { label: "1.2km", value: 1200 },
  { label: "2km", value: 2000 },
];

const DEFAULT_LOC = { lat: 40.4093, lng: 49.8671 }; // Bakı fallback

function safeJson(obj) {
  // prevent HTML injection from job text
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * İşçi axtaran paneli -> xəritə
 * Bütün elanlar marker kimi göstərilir (sənin lokasiyana görə radius).
 * Optimized: xəritə (Leaflet) bir dəfə yüklənir, marker-lər inject ilə yenilənir.
 */
export function EmployerMapScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [radius, setRadius] = useState(1200);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webReady, setWebReady] = useState(false);

  const didInit = useRef(false);
  const webRef = useRef(null);
  const cacheRef = useRef(new Map()); // key -> items

  const baseLoc = user?.location || null;
  const locKey = baseLoc?.lat && baseLoc?.lng ? `${baseLoc.lat}:${baseLoc.lng}` : "default";

  const jobs = useMemo(() => {
    return (items || [])
      .filter((j) => j?.location?.lat && j?.location?.lng)
      .map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        wage: j.wage,
        description: j.description,
        isDaily: j.isDaily,
        distanceM: j.distanceM,
        location: j.location,
      }));
  }, [items]);

  const jobsJson = useMemo(() => safeJson(jobs), [jobs]);

  async function load({ force = false } = {}) {
    try {
      if (!baseLoc?.lat || !baseLoc?.lng) return;

      const cacheKey = `${locKey}:${radius}`;
      if (!force && cacheRef.current.has(cacheKey)) {
        setItems(cacheRef.current.get(cacheKey));
        return;
      }

      setLoading(true);
      const data = await api.listJobsWithSearch({
        q: "",
        lat: baseLoc.lat,
        lng: baseLoc.lng,
        radius_m: radius,
        daily: undefined,
      });

      const list = data || [];
      cacheRef.current.set(cacheKey, list);
      setItems(list);
    } catch (e) {
      Alert.alert("Xəta", e.message || "Yükləmə xətası");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!baseLoc?.lat || !baseLoc?.lng) return;
    if (!didInit.current) {
      didInit.current = true;
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLoc?.lat, baseLoc?.lng]);

  useEffect(() => {
    if (!didInit.current) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius]);

  // WebView hazır olanda marker-ləri inject ilə yenilə (tam reload etmədən)
  useEffect(() => {
    if (!webReady) return;

    const js = `
      try {
        if (window.__ASIMOS_SET_JOBS) {
          window.__ASIMOS_SET_JOBS(${jobsJson});
        }
      } catch (e) {}
      true;
    `;

    webRef.current?.injectJavaScript(js);
  }, [webReady, jobsJson]);

  const baseHtml = useMemo(() => {
    const u = baseLoc || DEFAULT_LOC;

    const payload = {
      user: { lat: Number(u.lat || DEFAULT_LOC.lat), lng: Number(u.lng || DEFAULT_LOC.lng) },
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

    const map = L.map('map', { zoomControl: true }).setView([u.lat, u.lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

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

    const jobLayer = L.layerGroup().addTo(map);

    function fitTo(bounds) {
      try {
        if (bounds.length >= 2) map.fitBounds(bounds, { padding: [30, 30] });
        else map.setView([u.lat, u.lng], 13);
      } catch (e) {
        map.setView([u.lat, u.lng], 13);
      }
    }

    function setJobs(jobs) {
      jobLayer.clearLayers();
      const bounds = [[u.lat, u.lng]];

      (jobs || []).forEach((j) => {
        const lat = j.location && Number(j.location.lat);
        const lng = j.location && Number(j.location.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const marker = L.marker([lat, lng], { icon: jobIcon }).addTo(jobLayer);
        const cat = j.category ? ('<div style="margin-top:6px;color:#6b7280;font-weight:800">' + j.category + '</div>') : '';
        const wage = j.wage ? ('<div style="margin-top:4px;color:#111827;font-weight:900">' + j.wage + '</div>') : '';
        const dist = (typeof j.distanceM === 'number') ? ('<div style="margin-top:6px"><span class="tag">' + j.distanceM + ' m</span></div>') : '';

        marker.bindPopup(
          '<div style="font-weight:900;font-size:14px;color:#111827">' + (j.title || 'Elan') + '</div>' +
          cat + wage + dist +
          '<div style="margin-top:10px;color:#1d4ed8;font-weight:900">Detallara bax</div>'
        );

        marker.on('click', () => {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'job', payload: j }));
          } catch (e) {}
        });

        bounds.push([lat, lng]);
      });

      fitTo(bounds);
    }

    // Expose for RN inject
    window.__ASIMOS_SET_JOBS = setJobs;
    setJobs([]);
  </script>
</body>
</html>`;
  }, [baseLoc?.lat, baseLoc?.lng]);

  const radiusOptions = useMemo(() => RADIUS_PRESETS.map((x) => ({ label: x.label, value: x.value })), []);

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("EmployerTabs");
          }}
          style={styles.iconBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Xəritə</Text>
          <Text style={styles.sub}>Bütün elanlar (radius: {radius}m)</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => load({ force: true })} style={styles.iconBtn}>
            <Ionicons name={loading ? "time-outline" : "refresh"} size={22} color={Colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <SegmentedControl options={radiusOptions} value={radius} onChange={setRadius} />
      </View>

      <View style={styles.mapWrap}>
        <WebView
          ref={webRef}
          key={locKey}
          originWhitelist={["*"]}
          source={{ html: baseHtml }}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          cacheMode={Platform.OS === "android" ? "LOAD_CACHE_ELSE_NETWORK" : undefined}
          onLoadStart={() => setWebReady(false)}
          onLoadEnd={() => setWebReady(true)}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg?.type === "job" && msg?.payload) {
                navigation.navigate("JobDetail", { job: msg.payload });
              }
            } catch {}
          }}
        />

        {(!webReady || loading) && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Xəritə yüklənir…</Text>
          </View>
        )}
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
    gap: 12,
  },
  titleWrap: { flex: 1 },
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
  mapWrap: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  loadingText: {
    marginTop: 10,
    fontWeight: "900",
    color: Colors.muted,
  },
});
