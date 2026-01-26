import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "../theme/colors";

export function MapPreview({ userLocation, jobLocation, height = 220 }) {
  const html = useMemo(() => {
    const u = userLocation || null;
    const j = jobLocation || null;

    const centerLat = (j?.lat ?? u?.lat ?? 40.4093);
    const centerLng = (j?.lng ?? u?.lng ?? 49.8671);

    const uLat = u?.lat ?? null;
    const uLng = u?.lng ?? null;
    const jLat = j?.lat ?? null;
    const jLng = j?.lng ?? null;

    // Inject numbers/null into HTML JS
    const uLatJs = (uLat === null ? "null" : Number(uLat));
    const uLngJs = (uLng === null ? "null" : Number(uLng));
    const jLatJs = (jLat === null ? "null" : Number(jLat));
    const jLngJs = (jLng === null ? "null" : Number(jLng));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;}
    #map{height:100%;width:100%}
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${Number(centerLat)}, ${Number(centerLng)}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const bounds = [];

    const userIcon = L.divIcon({
      className: 'user-dot',
      html: '<div style="width:14px;height:14px;border-radius:999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.18)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="width:18px;height:18px;border-radius:999px;background:#16a34a;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.18)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const uLat = ${uLatJs};
    const uLng = ${uLngJs};
    const jLat = ${jLatJs};
    const jLng = ${jLngJs};

    if (jLat !== null && jLng !== null) {
      const m = L.marker([jLat, jLng], { icon: jobIcon }).addTo(map);
      m.bindPopup('Elanın lokasiyası');
      bounds.push([jLat, jLng]);
    }

    if (uLat !== null && uLng !== null) {
      const m2 = L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
      m2.bindPopup('Sənin lokasiyan');
      bounds.push([uLat, uLng]);
    }

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  </script>
</body>
</html>`;
  }, [userLocation, jobLocation]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
});
