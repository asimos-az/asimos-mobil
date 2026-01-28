import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";
import { API_BASE_URL } from "../api/client";

export function MapPicker({ visible, onClose, onPicked, initial, userLocation }) {
  const [webReady, setWebReady] = useState(false);
  const [webError, setWebError] = useState("");

  useEffect(() => {
    if (visible) {
      setWebReady(false);
      setWebError("");
    }
  }, [visible]);

  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(0, Number(insets?.bottom || 0));
  const safeTop = Math.max(0, Number(insets?.top || 0));

  const html = useMemo(() => {
    const initLat = Number(initial?.lat ?? 40.4093);
    const initLng = Number(initial?.lng ?? 49.8671);
    const initAddress = initial?.address ?? "";

    const uLat = (typeof userLocation?.lat === "number") ? Number(userLocation.lat) : null;
    const uLng = (typeof userLocation?.lng === "number") ? Number(userLocation.lng) : null;
    const apiBase = String(API_BASE_URL || "").replace(/\/$/, "");

    // JSON literals to embed safely
    const apiBaseJSON = JSON.stringify(apiBase);
    const initAddressJSON = JSON.stringify(initAddress);

    const safeBottomPx = Math.round(Number(safeBottom) || 0);
    const safeTopPx = Math.round(Number(safeTop) || 0);

    const uLatJs = (uLat === null ? "null" : Number(uLat));
    const uLngJs = (uLng === null ? "null" : Number(uLng));

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    :root{--safeBottom:${safeBottomPx}px;--safeTop:${safeTopPx}px;}
    html,body{margin:0;padding:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
    body{position:relative;background:#fff}
    #top{display:flex;gap:8px;padding:10px;border-bottom:1px solid #e5e7eb;align-items:center}
    #q{flex:1;padding:10px 12px;border:1px solid #e5e7eb;border-radius:12px;font-size:14px;outline:none}
    #btn{padding:10px 12px;border-radius:12px;border:1px solid #e5e7eb;background:#111827;color:#fff;font-weight:900}
    #hint{padding:0 10px 10px;color:#6b7280;font-size:12px}
    /* Keep actions above phone bottom bar / home indicator */
    #bottom{position:fixed;left:0;right:0;bottom:0;display:flex;gap:10px;padding:12px;
      padding-bottom:calc(12px + var(--safeBottom) + env(safe-area-inset-bottom));
      background:rgba(255,255,255,0.96);border-top:1px solid #e5e7eb}
    /* Map should not be hidden under bottom actions */
    #map{position:absolute;left:0;right:0;top:114px;
      bottom:calc(78px + var(--safeBottom) + env(safe-area-inset-bottom));width:100%}
    .b{flex:1;padding:12px;border-radius:14px;font-weight:900}
    #cancelBtn{border:1px solid #e5e7eb;background:#fff}
    #pickBtn{border:1px solid #1d4ed8;background:#1d4ed8;color:#fff}
    #sel{position:absolute;left:0;right:0;
      bottom:calc(78px + var(--safeBottom) + env(safe-area-inset-bottom));
      padding:10px;color:#111827;font-weight:800;font-size:12px;background:rgba(255,255,255,0.92);
      border-top:1px solid #e5e7eb}
  </style>
</head>
<body>
  <div id="top">
    <input id="q" placeholder="Azərbaycan üzrə axtarış (məs: Nizami rayonu, Məmməd küçəsi)" />
    <button id="btn">Axtar</button>
  </div>
  <div id="hint">Axtarış yalnız Azərbaycan daxilində nəticələr gətirir.</div>
  <div id="map"></div>
  <div id="sel"></div>
  <div id="bottom">
    <button class="b" id="cancelBtn">Ləğv et</button>
    <button class="b" id="pickBtn">Seç</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    window.onerror = function (msg, src, line, col) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: String(msg || 'Map error') })); } catch (e) {}
      return false;
    };
    const API_BASE = ${apiBaseJSON};
    const map = L.map('map', { zoomControl: true }).setView([${initLat}, ${initLng}], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const uLat = ${uLatJs};
    const uLng = ${uLngJs};
    if (uLat !== null && uLng !== null) {
      const userIcon = L.divIcon({
        className: 'user-dot',
        html: '<div style="width:14px;height:14px;border-radius:999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.18)"></div>',
        iconSize: [14,14],
        iconAnchor: [7,7]
      });
      const um = L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
      um.bindPopup('Sənin lokasiyan');
    }

    let marker = null;
    let selected = { lat: ${initLat}, lng: ${initLng}, address: ${initAddressJSON} };

    function setSelected(lat, lng, address) {
      selected = { lat, lng, address: address || '' };
      if (!marker) marker = L.marker([lat, lng]).addTo(map);
      marker.setLatLng([lat, lng]);
      document.getElementById('sel').innerText =
        address ? ('Seçilən: ' + address) : ('Seçilən: ' + lat.toFixed(5) + ', ' + lng.toFixed(5));
    }

    map.on('click', (e) => {
      setSelected(e.latlng.lat, e.latlng.lng, '');
    });

    async function search(q) {
      try {
        const url = API_BASE + '/geo/search?q=' + encodeURIComponent(q);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();

        if (!res.ok) {
          alert((data && data.error) ? data.error : 'Axtarış alınmadı');
          return;
        }

        if (data && data[0]) {
          const lat = Number(data[0].lat);
          const lng = Number(data[0].lon);
          map.setView([lat, lng], 14);
          setSelected(lat, lng, data[0].display_name || '');
        } else {
          alert('Tapılmadı');
        }
      } catch (e) {
        alert('Axtarış xətası');
      }
    }

    document.getElementById('btn').addEventListener('click', () => {
      const q = document.getElementById('q').value.trim();
      if (q) search(q);
    });

    document.getElementById('q').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = document.getElementById('q').value.trim();
        if (q) search(q);
      }
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancel' }));
    });

    document.getElementById('pickBtn').addEventListener('click', () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pick', payload: selected }));
    });

    setSelected(${initLat}, ${initLng}, ${initAddressJSON});
    // Let React Native know the web map is ready (tiles might still load, but UI is rendered)
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' })); } catch(e) {}
  </script>
</body>
</html>`;
  }, [initial?.lat, initial?.lng, initial?.address, userLocation?.lat, userLocation?.lng, safeBottom, safeTop]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.header, { paddingTop: safeTop + 8 }]}>
        <Text style={styles.title}>Lokasiya seç</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Bağla</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
      <WebView
        style={{ flex: 1 }}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onLoadEnd={() => setWebReady(true)}
        onError={(e) => {
          setWebError(e?.nativeEvent?.description || "Xəritə yüklənmədi");
        }}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === "ready") setWebReady(true);
            if (msg.type === "error") {
              setWebError(msg.message || "Xəritə yüklənmədi");
              return;
            }
            if (msg.type === "cancel") onClose?.();
            if (msg.type === "pick") {
              const p = msg.payload || {};
              onPicked?.({
                lat: Number(p.lat),
                lng: Number(p.lng),
                address: p.address || "Seçilən lokasiya",
              });
              onClose?.();
            }
          } catch {}
        }}
      />
      {!webReady && !webError ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Xəritə yüklənir...</Text>
        </View>
      ) : null}
      {webError ? (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Xəritə açılmadı</Text>
          <Text style={styles.errorText}>{String(webError)}</Text>
          <Text style={styles.errorText}>İnternet bağlantısını yoxlayın və yenidən cəhd edin.</Text>
        </View>
      ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  title: { fontSize: 16, fontWeight: "900", color: Colors.text },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
  },
  closeText: { color: Colors.primary, fontWeight: "900" },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  loadingText: { marginTop: 10, color: Colors.text, fontWeight: "800" },
  errorOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  errorTitle: { fontWeight: "900", color: Colors.text, marginBottom: 6 },
  errorText: { color: Colors.muted, fontWeight: "700" },
});
