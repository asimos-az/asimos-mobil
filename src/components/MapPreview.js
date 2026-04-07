import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "../theme/colors";
import { BAKU_METROS, BAKU_UNIVERSITIES } from "../constants/MapData";

export function MapPreview({ userLocation, jobLocation, height = 220, jobTitle = "Vakansiya", jobAddress = "", jobWage = "" }) {
  const html = useMemo(() => {
    const u = userLocation || null;
    const j = jobLocation || null;

    const centerLat = (j?.lat ?? u?.lat ?? 40.4093);
    const centerLng = (j?.lng ?? u?.lng ?? 49.8671);

    const uLat = u?.lat ?? null;
    const uLng = u?.lng ?? null;
    const jLat = j?.lat ?? null;
    const jLng = j?.lng ?? null;

    const titleStr = JSON.stringify(jobTitle);
    const addrStr = JSON.stringify(jobAddress);
    const wageStr = JSON.stringify(jobWage);

    const metroData = JSON.stringify(BAKU_METROS);
    const uniData = JSON.stringify(BAKU_UNIVERSITIES);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:sans-serif;background-color:#e5e7eb;}
    #map{height:100%;width:100%}
    .landmark-icon { display: flex; align-items: center; justify-content: center; font-size: 14px; background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <script>
    try {
      const jLat = Number(${jLat}) || null;
      const jLng = Number(${jLng}) || null;
      const uLat = Number(${uLat}) || null;
      const uLng = Number(${uLng}) || null;

      const map = L.map('map', { 
        zoomControl: false, 
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      }).setView([jLat || 40.4093, jLng || 49.8671], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);

      const userIcon = L.divIcon({
        className: 'user-dot',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2)"></div>',
        iconSize: [14, 14], iconAnchor: [7, 7]
      });
      const jobIcon = L.divIcon({
        className: 'job-pin',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2)"></div>',
        iconSize: [18, 18], iconAnchor: [9, 9]
      });

      if (jLat && jLng) {
        const jMarker = L.marker([jLat, jLng], { icon: jobIcon, zIndexOffset: 1000 }).addTo(map);
        const titleStr = ${titleStr};
        const addrStr = ${addrStr};
        const wageStr = ${wageStr};
        const popupHtml = '<div style="font-family:sans-serif; text-align:center; min-width:120px;">' +
                          '<strong style="font-size:12px; display:block; margin-bottom:2px;">' + titleStr + '</strong>' +
                          '<span style="color:#6B7280; font-size:10px; display:block; margin-bottom:4px;">' + addrStr + '</span>' +
                          '<span style="color:#16a34a; font-weight:900; font-size:11px;">' + wageStr + '</span>' +
                          '</div>';
        jMarker.bindPopup(popupHtml).openPopup();
      }

      if (uLat && uLng) {
        L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
      }

      // Landmarks logic - wrapped to prevent failure
      try {
        const metros = ${metroData};
        const unis = ${uniData};
        const metroIcon = L.divIcon({ className: 'landmark-icon', html: '<span>🚇</span>', iconSize: [20, 20], iconAnchor: [10, 10] });
        const uniIcon = L.divIcon({ className: 'landmark-icon', html: '<span>🎓</span>', iconSize: [20, 20], iconAnchor: [10, 10] });
        
        if (Array.isArray(metros)) {
          metros.forEach(m => L.marker([m.lat, m.lng], { icon: metroIcon, opacity: 0.8 }).addTo(map).bindPopup(m.name));
        }
        if (Array.isArray(unis)) {
          unis.forEach(u => L.marker([u.lat, u.lng], { icon: uniIcon, opacity: 0.8 }).addTo(map).bindPopup(u.name));
        }
      } catch (e) {
        console.error("Landmarks fail:", e);
      }

      if (uLat && uLng && jLat && jLng) {
        const dist = map.distance([uLat, uLng], [jLat, jLng]);
        if (dist > 100000) {
            map.setView([jLat, jLng], 14);
        } else {
            const bounds = L.latLngBounds([[uLat, uLng], [jLat, jLng]]);
            map.fitBounds(bounds, { padding: [30, 30] });
        }
      } else if (jLat && jLng) {
        map.setView([jLat, jLng], 14);
      }
    } catch (err) {
      document.body.innerHTML = '<div style="padding:20px; color:#ef4444; font-size:12px;">Map initialization error</div>';
    }
  </script>
</body>
</html>`;
  }, [userLocation, jobLocation, jobTitle, jobAddress, jobWage]);

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
