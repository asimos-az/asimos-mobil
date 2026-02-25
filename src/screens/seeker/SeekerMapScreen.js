import React, { useMemo, useState } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client"; // Add api import

export function SeekerMapScreen() {
  const nav = useNavigation();
  const route = useRoute();
  // If jobs passed via params, use them. Otherwise default to empty array and we'll fetch.
  const initialJobs = route.params?.jobs;
  const userLocation = route.params?.userLocation || null;

  const [jobs, setJobs] = useState(initialJobs || []);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const webRef = React.useRef(null);

  // Fetch jobs if not provided (e.g. Tab press)
  React.useEffect(() => {
    if (!initialJobs) {
      (async () => {
        try {
          const data = await api.listJobsWithSearch({ q: "", radius_m: undefined });
          setJobs(data);
        } catch (e) {
          // silent error or console
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [initialJobs]);


  // Live location watcher
  React.useEffect(() => {
    let sub = null;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (webRef.current) {
            webRef.current.injectJavaScript(`
              try { if(window.updateMe) window.updateMe(${latitude}, ${longitude}); } catch(e){}
              true;
            `);
          }
        }
      );
    })();
    return () => sub?.remove();
  }, []);

  const html = useMemo(() => {
    const uLat = (typeof userLocation?.lat === "number") ? Number(userLocation.lat) : null;
    const uLng = (typeof userLocation?.lng === "number") ? Number(userLocation.lng) : null;

    const jobsData = JSON.stringify(jobs.map(j => ({
      id: j.id,
      title: j.title || "İş elanı",
      lat: Number(j.location?.lat),
      lng: Number(j.location?.lng),
      wage: j.wage || ""
    })).filter(j => j.lat && j.lng)); // Only valid coords

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;}
    #map{height:100%;width:100%}
    .leaflet-routing-container { display: none !important; } /* Hide default routing text instructions */
    
    /* Custom Info Card */
    #info-card {
      position: fixed; bottom: 110px; left: 16px; right: 16px;
      background: white; padding: 16px; border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      z-index: 9999; display: none;
      transition: transform 0.3s ease;
      transform: translateY(150%);
    }
    #info-card.visible { transform: translateY(0); display: block; }
    .card-title { font-weight: 800; font-size: 16px; color: #111827; margin-bottom: 4px; }
    .card-meta { color: #4b5563; font-size: 14px; margin-bottom: 12px; }
    .card-btn {
      display: block; width: 100%; background: #111827; color: white;
      text-align: center; padding: 12px; border-radius: 12px;
      text-decoration: none; font-weight: 700; border: none; font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div id="info-card">
    <div class="card-title" id="card-title"></div>
    <div class="card-meta" id="card-meta"></div>
    <button class="card-btn" id="card-btn">Detallara bax</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script>
    const jobs = ${jobsData};
    const uLat = ${uLat};
    const uLng = ${uLng};

    const map = L.map('map', { zoomControl: false }).setView([40.4093, 49.8671], 12);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    osm.addTo(map);

    const baseMaps = {
      "Xəritə": osm,
      "Peyk": sat
    };

    L.control.layers(baseMaps).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    function send(type, payload) {
      if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
    }

    let um = null;
    window.updateMe = function(lat, lng) {
      if(um) {
        um.setLatLng([lat, lng]);
      } else {
        const uIcon = L.divIcon({
          className: 'user-dot',
          html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3)"></div>',
          iconSize: [16,16], iconAnchor: [8,8]
        });
        um = L.marker([lat, lng], { icon: uIcon, zIndexOffset: 1000 }).addTo(map);
      }
    };

    if(uLat && uLng) {
      window.updateMe(uLat, uLng);
    }

    let currentRoute = null;
    let selectedJob = null;

    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="width:24px;height:24px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:12px">💼</div>',
      iconSize: [24,24], iconAnchor: [12,12]
    });

    const boundsArr = [];
    if(uLat && uLng) boundsArr.push([uLat, uLng]);

    jobs.forEach(j => {
      const m = L.marker([j.lat, j.lng], { icon: jobIcon }).addTo(map);
      j.marker = m; // Store reference
      boundsArr.push([j.lat, j.lng]);
      
      m.on('click', () => {
        selectJob(j);
      });
    });

    let heatLayer = null;
    window.toggleHeatmap = function(show) {
      if(show) {
        if(!heatLayer) {
           const points = jobs.map(j => [j.lat, j.lng, 1]);
           heatLayer = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);
        }
        // Hide markers when heatmap is on? Optional. Let's keep them or hide them.
        // Let's toggle markers visibility for cleaner view
        jobs.forEach(j => j.marker.setOpacity(0));
      } else {
        if(heatLayer) {
          map.removeLayer(heatLayer);
          heatLayer = null;
        }
        jobs.forEach(j => j.marker.setOpacity(1));
      }
    };

    if(boundsArr.length > 0) {
      map.fitBounds(boundsArr, { padding: [50, 50] });
    }

    function selectJob(job) {
      selectedJob = job;
      
      document.getElementById('card-title').innerText = job.title;
      document.getElementById('card-meta').innerText = (job.wage ? (job.wage + ' • ') : '') + 'Hesablanır...';
      document.getElementById('info-card').className = 'visible';
      
      if(currentRoute) { map.removeControl(currentRoute); currentRoute = null; }

      if(uLat && uLng) {
        currentRoute = L.Routing.control({
          waypoints: [ L.latLng(uLat, uLng), L.latLng(job.lat, job.lng) ],
          lineOptions: { styles: [{color: '#3b82f6', opacity: 0.8, weight: 6}] },
          createMarker: () => null,
          show: false, addWaypoints: false, draggableWaypoints: false, fitSelectedRoutes: false
        }).on('routesfound', function(e) {
          const r = e.routes[0];
          const dist = (r.summary.totalDistance / 1000).toFixed(1);
          const time = Math.round(r.summary.totalTime / 60);
          document.getElementById('card-meta').innerText = (job.wage ? (job.wage + ' • ') : '') + dist + ' km • ' + time + ' dəq';
        }).addTo(map);
      } else {
        document.getElementById('card-meta').innerText = job.wage || '';
      }
    }

    document.getElementById('card-btn').addEventListener('click', () => {
      if(selectedJob) send('openJob', selectedJob.id);
    });

    map.on('click', (e) => {
      if(e.originalEvent.target.id === 'map') {
         document.getElementById('info-card').className = '';
         if(currentRoute) { map.removeControl(currentRoute); currentRoute = null; }
      }
    });

  </script>
</body>
</html>`;
  }, [jobs, userLocation]);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="close-circle" size={32} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Xəritədə Nəticələr</Text>
        <Pressable
          onPress={() => {
            const next = !showHeatmap;
            setShowHeatmap(next);
            webRef.current?.injectJavaScript(`window.toggleHeatmap(${next}); true;`);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
        >
          <Ionicons name={showHeatmap ? "Flame" : "flame-outline"} size={28} color={showHeatmap ? "#ef4444" : Colors.primary} />
        </Pressable>
      </View>

      <WebView
        ref={webRef}
        source={{ html }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'openJob') {
              const fullJob = jobs.find(j => j.id === data.payload);
              if (fullJob) nav.navigate('JobDetail', { job: fullJob });
            }
          } catch { }
        }}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20
  }
});
