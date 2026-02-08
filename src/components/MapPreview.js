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
  <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
    #map{height:100%;width:100%}
    .leaflet-routing-container { 
      background-color: white; 
      padding: 5px; 
      margin: 10px !important;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${Number(centerLat)}, ${Number(centerLng)}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const uLat = ${uLatJs};
    const uLng = ${uLngJs};
    const jLat = ${jLatJs};
    const jLng = ${jLngJs};

    const userIcon = L.divIcon({
      className: 'user-dot',
      html: '<div style="width:14px;height:14px;border-radius:999px;background:#1d4ed8;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="width:18px;height:18px;border-radius:999px;background:#16a34a;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    if (jLat !== null && jLng !== null) {
      L.marker([jLat, jLng], { icon: jobIcon }).addTo(map).bindPopup('İş').openPopup();
    }
    if (uLat !== null && uLng !== null) {
      L.marker([uLat, uLng], { icon: userIcon }).addTo(map).bindPopup('Sən');
    }

    if (uLat !== null && uLng !== null && jLat !== null && jLng !== null) {
      L.Routing.control({
        waypoints: [
          L.latLng(uLat, uLng),
          L.latLng(jLat, jLng)
        ],
        lineOptions: {
          styles: [{color: '#3b82f6', opacity: 0.7, weight: 5}]
        },
        createMarker: function() { return null; }, // Hide default markers, we added ours
        show: false, // Don't show the itinerary table
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        formatter: new L.Routing.Formatter({
          language: 'az', // Try to localize if supported or defaults to en
          units: 'metric'
        })
      }).on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        const distKm = (summary.totalDistance / 1000).toFixed(1);
        const timeMin = Math.round(summary.totalTime / 60);
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = '<div style="background:white;padding:8px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);position:absolute;bottom:20px;left:20px;z-index:999;">' +
                            '<b>🚗 Avtomobil:</b> ' + distKm + ' km • ' + timeMin + ' dəq' +
                            '</div>';
        document.body.appendChild(infoDiv);
      }).addTo(map);
      
      const bounds = L.latLngBounds([ [uLat, uLng], [jLat, jLng] ]);
      map.fitBounds(bounds, { padding: [50, 50] });

    } else if (jLat !== null && jLng !== null) {
       map.setView([jLat, jLng], 14);
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
