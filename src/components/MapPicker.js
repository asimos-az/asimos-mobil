import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "../theme/colors";

export function MapPicker({ visible, onClose, onPicked, initial }) {
  const html = useMemo(() => {
    const initLat = initial?.lat ?? 40.4093;
    const initLng = initial?.lng ?? 49.8671;
    const initZoom = 12;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;}
    #top{position:absolute;left:12px;right:12px;top:12px;z-index:9999;display:flex;gap:8px}
    #q{flex:1;padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;font-size:14px}
    #btn{padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#1d4ed8;color:#fff;font-weight:700}
    #hint{position:absolute;left:12px;right:12px;bottom:12px;z-index:9999;background:rgba(255,255,255,0.92);border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-size:12px;color:#0f172a}
    #map{height:100%;width:100%}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="top">
    <input id="q" placeholder="Axtar (məs: Bakı, Nizami)" />
    <button id="btn">Axtar</button>
  </div>
  <div id="hint">
    Xəritədə toxunub lokasiyanı seç. Sonra <b>“Seç”</b> düyməsi çıxacaq.
    <div id="picked"></div>
    <div id="actions" style="margin-top:8px;display:none;gap:8px">
      <button id="pickBtn" style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#16a34a;color:#fff;font-weight:700">Seç</button>
      <button id="cancelBtn" style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#0f172a;font-weight:700">Ləğv et</button>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${initLat}, ${initLng}], ${initZoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    let marker = null;
    let selected = null;

    function setSelected(lat, lng, address) {
      selected = { lat, lng, address: address || "" };
      if (marker) marker.remove();
      marker = L.marker([lat, lng]).addTo(map);
      document.getElementById('picked').innerHTML = address
        ? ("Seçilən: <b>" + address + "</b>")
        : ("Seçilən: <b>" + lat.toFixed(6) + ", " + lng.toFixed(6) + "</b>");
      document.getElementById('actions').style.display = "flex";
    }

    async function reverseGeocode(lat, lng) {
      try {
        const url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + lat + '&lon=' + lng;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
        const data = await res.json();
        return data.display_name || '';
      } catch (e) { return ''; }
    }

    map.on('click', async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const address = await reverseGeocode(lat, lng);
      setSelected(lat, lng, address);
    });

    async function search(q) {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=' + encodeURIComponent(q);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        map.setView([lat, lng], 14);
        setSelected(lat, lng, data[0].display_name || '');
      } else {
        alert('Tapılmadı');
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
      if (!selected) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'picked', payload: selected }));
    });
  </script>
</body>
</html>`;
  }, [initial]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Lokasiya seç</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Bağla</Text>
          </Pressable>
        </View>

        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === "cancel") onClose?.();
              if (msg.type === "picked") {
                onPicked?.(msg.payload);
                onClose?.();
              }
            } catch {}
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  closeBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: Colors.primarySoft },
  closeText: { color: Colors.primary, fontWeight: "900" },
});
