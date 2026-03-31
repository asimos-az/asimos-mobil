import React, { useMemo, useState, useRef } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { api } from "../../api/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JobsFilterModal } from "../../components/JobsFilterModal";
import { NotificationBell } from "../../components/NotificationBell";
import * as Notifications from "expo-notifications";

const RADIUS_PRESETS = [
  { label: "Ölkə üzrə", value: 0 },
  { label: "1km", value: 1000 },
  { label: "5km", value: 5000 },
  { label: "10km", value: 10000 },
];

export function SeekerMapScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const initialJobs = route.params?.jobs;
  const userLocation = route.params?.userLocation || null;

  const [jobs, setJobs] = useState(initialJobs || []);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const webRef = useRef(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(0);
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(0);

  const radiusOptions = useMemo(() => RADIUS_PRESETS.map((x) => ({ label: x.label, value: x.value })), []);

  const categories = useMemo(() => {
    const set = new Set();
    (jobs || []).forEach((it) => {
      if (it?.category) set.add(String(it.category));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) => {
      const s = new Set(prev || []);
      if (s.has(cat)) s.delete(cat); else s.add(cat);
      return Array.from(s);
    });
  }

  function resetFilters() {
    setQ("");
    setRadius(0);
    setMinWage("");
    setMaxWage("");
    setSelectedCategories([]);
  }

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.listJobsWithSearch({ 
        q, 
        radius_m: radius > 0 ? radius : undefined,
        minWage: minWage || undefined,
        maxWage: maxWage || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
      setJobs(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadJobs();
  }, [initialJobs]);

  React.useEffect(() => {
    async function syncUnread() {
      try {
        const r = await api.getUnreadNotificationsCount();
        const current = r?.unread || 0;
        if (current > prevUnread.current) {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Yeni bildiriş", body: "Sizin üçün yeni bildiriş var.", sound: true },
            trigger: null,
          });
        }
        prevUnread.current = current;
        setUnread(current);
      } catch {}
    }
    syncUnread();
    const t = setInterval(syncUnread, 5000);
    return () => clearInterval(t);
  }, []);

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
      wage: j.wage || "",
      company: j.company || "Asimos"
    })).filter(j => j.lat && j.lng)); 

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    #map{height:100%;width:100%}
    .leaflet-routing-container { display: none !important; } 
    .leaflet-control-zoom { display: none !important; }
    
    /* Modern Bottom Sheet Card */
    #info-card {
      position: fixed; bottom: 180px; left: 16px; right: 16px;
      background: white; padding: 20px; border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 9999; display: none;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform: translateY(150%);
    }
    #info-card.visible { transform: translateY(0); display: block; }
    .card-handle {
      width: 40px; height: 4px; background: #E5E7EB; 
      border-radius: 4px; margin: 0 auto 16px auto;
    }
    .card-close {
      position: absolute; top: 16px; right: 16px; width: 28px; height: 28px;
      background: #F3F4F6; border-radius: 14px; display: flex;
      align-items: center; justify-content: center; color: #4B5563;
      font-weight: bold; cursor: pointer; font-size: 14px;
    }
    .card-title { font-weight: 800; font-size: 18px; color: #111827; margin-bottom: 8px; padding-right: 30px; }
    .card-meta { color: #4B5563; font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .card-bg-icon { display: inline-block; width: 16px; text-align: center; }
    
    .card-actions { display: flex; gap: 10px; }
    .card-btn {
      flex: 1; background: #F3F4F6; color: #111827;
      text-align: center; padding: 14px; border-radius: 16px;
      text-decoration: none; font-weight: 700; border: none; font-size: 15px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      cursor: pointer;
    }
    .card-btn.primary { background: #16A34A; color: white; }

    /* Custom markers */
    .user-dot {
       filter: drop-shadow(0 0 10px rgba(59,130,246,0.6));
    }
    .user-inner {
      width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;
    }
    .job-pin {
       filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
    }
    .job-inner {
      width:28px;height:28px;border-radius:50%;background:#ffffff;border:3px solid #16a34a;
      display:flex;align-items:center;justify-content:center;color:#16a34a;font-weight:bold;font-size:14px;
    }
    
    .pulsing-circle {
       animation: pulse 2s infinite;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div id="info-card">
    <div class="card-handle"></div>
    <div class="card-close" id="card-close">✕</div>
    <div class="card-title" id="card-title"></div>
    <div class="card-meta">
       <span class="card-bg-icon">📍</span>
       <span id="card-dist"></span>
    </div>
    <div class="card-meta">
       <span class="card-bg-icon">💰</span>
       <span id="card-wage"></span>
    </div>
    <div class="card-actions">
       <button class="card-btn primary" id="card-btn">Detallara bax</button>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script>
    const jobs = ${jobsData};
    const uLat = ${uLat};
    const uLng = ${uLng};

    const map = L.map('map', { zoomControl: false }).setView([40.4093, 49.8671], 13);
    
    // Satellite Tile Layer (Google Hybrid)
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }).addTo(map);

    function send(type, payload) {
      if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
    }

    let um = null;
    let radiusCircle = null;
    
    window.updateMe = function(lat, lng) {
      if(um) {
        um.setLatLng([lat, lng]);
        if(radiusCircle) radiusCircle.setLatLng([lat, lng]);
      } else {
        const uIcon = L.divIcon({
          className: 'user-dot',
          html: '<div class="user-inner"></div>',
          iconSize: [24,24], iconAnchor: [12,12]
        });
        um = L.marker([lat, lng], { icon: uIcon, zIndexOffset: 2000 }).addTo(map);
        
        radiusCircle = L.circle([lat, lng], {
           color: '#3b82f6',
           fillColor: '#3b82f6',
           fillOpacity: 0.15,
           weight: 2,
           radius: 300 // 300m radius
        }).addTo(map);
      }
      map.setView([lat, lng], 14, {animate: true});
    };

    window.centerMap = function() {
       if(um) {
          map.setView(um.getLatLng(), 15, {animate: true});
       }
    };
    
    window.zoomInMap = function() { map.zoomIn(); };
    window.zoomOutMap = function() { map.zoomOut(); };

    if(uLat && uLng) {
      window.updateMe(uLat, uLng);
    }

    let currentRoute = null;
    let selectedJob = null;

    const boundsArr = [];
    if(uLat && uLng) boundsArr.push([uLat, uLng]);

    jobs.forEach(j => {
      const jobIcon = L.divIcon({
        className: 'job-pin',
        html: '<div class="job-inner">💼</div>',
        iconSize: [34,34], iconAnchor: [17,17]
      });
        
      const m = L.marker([j.lat, j.lng], { icon: jobIcon }).addTo(map);
      j.marker = m; 
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
      document.getElementById('card-wage').innerText = job.wage || 'Razılaşma ilə';
      document.getElementById('card-dist').innerText = 'Hesablanır...';
      document.getElementById('info-card').className = 'visible';
      
      if(currentRoute) { map.removeControl(currentRoute); currentRoute = null; }

      if(um && um.getLatLng()) {
        const uPos = um.getLatLng();
        currentRoute = L.Routing.control({
          waypoints: [ L.latLng(uPos.lat, uPos.lng), L.latLng(job.lat, job.lng) ],
          lineOptions: { styles: [{color: '#3b82f6', opacity: 0.8, weight: 5, dashArray: '10,14'}] },
          createMarker: () => null,
          show: false, addWaypoints: false, draggableWaypoints: false, fitSelectedRoutes: false
        }).on('routesfound', function(e) {
          const r = e.routes[0];
          const distM = r.summary.totalDistance;
          let distStr = Math.round(distM) + ' m';
          if (distM >= 1000) {
            const km = distM/1000;
            distStr = Number.isInteger(km) ? km + ' km' : km.toFixed(1) + ' km';
          }
          const time = Math.round(r.summary.totalTime / 60);
          document.getElementById('card-dist').innerText = distStr + ' • ~' + time + ' dəq (piyada)';
        }).addTo(map);
      } else {
        document.getElementById('card-dist').innerText = 'Məsafə naməlumdur';
      }
    }

    document.getElementById('card-btn').addEventListener('click', () => {
      if(selectedJob) send('openJob', selectedJob.id);
    });
    
    document.getElementById('card-close').addEventListener('click', () => {
      document.getElementById('info-card').className = '';
      if(currentRoute) { map.removeControl(currentRoute); currentRoute = null; }
    });

  </script>
</body>
</html>`;
  }, [jobs, userLocation]);

  const hasActiveFilters = !!(q?.trim() || minWage || maxWage || (selectedCategories?.length) || radius > 0);

  return (
    <View style={styles.container}>
      <JobsFilterModal
        visible={filterOpen}
        title="Filtrlər"
        q={q}
        setQ={setQ}
        minWage={minWage}
        setMinWage={setMinWage}
        maxWage={maxWage}
        setMaxWage={setMaxWage}
        radius={radius}
        setRadius={setRadius}
        radiusOptions={radiusOptions}
        categories={categories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        baseLocation={userLocation}
        onReset={resetFilters}
        onApply={() => {
          setFilterOpen(false);
          loadJobs();
        }}
        onClose={() => setFilterOpen(false)}
      />

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
        containerStyle={{ backgroundColor: '#111827' }}
      />

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Floating Overlays */}
      <View style={[styles.floatingTopLeft, { top: insets.top + 16, flexDirection: 'row', gap: 12 }]}>
        <Pressable style={styles.circleBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        <NotificationBell count={unread} onPress={() => nav.navigate("SeekerNotifications")} />
      </View>

      <View style={[styles.floatingTopRight, { top: insets.top + 16 }]}>
        <Pressable 
          style={[styles.circleBtn, showHeatmap && styles.circleBtnActive]} 
          onPress={() => {
            const next = !showHeatmap;
            setShowHeatmap(next);
            webRef.current?.injectJavaScript(`window.toggleHeatmap(${next}); true;`);
          }}
        >
          <Ionicons name={showHeatmap ? "flame" : "flame-outline"} size={24} color={showHeatmap ? "#ef4444" : "#111"} />
        </Pressable>
      </View>

      <View style={[styles.floatingBottomRight, { bottom: insets.bottom + 160 }]}>
        <Pressable style={[styles.smCircleBtn, { marginBottom: 8 }]} onPress={() => {
            webRef.current?.injectJavaScript(`window.zoomInMap(); true;`);
        }}>
          <Ionicons name="add" size={24} color="#111" />
        </Pressable>
        <Pressable style={[styles.smCircleBtn, { marginBottom: 20 }]} onPress={() => {
            webRef.current?.injectJavaScript(`window.zoomOutMap(); true;`);
        }}>
          <Ionicons name="remove" size={24} color="#111" />
        </Pressable>

        <Pressable style={[styles.circleBtn, { marginBottom: 12 }]} onPress={() => {
            webRef.current?.injectJavaScript(`window.centerMap(); true;`);
        }}>
          <Ionicons name="location-outline" size={24} color="#111" />
        </Pressable>
        <Pressable style={styles.circleBtn} onPress={() => setFilterOpen(true)}>
          <Ionicons name="options-outline" size={24} color="#111" />
          {hasActiveFilters ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>

      <View style={[styles.floatingBottomCenter, { bottom: insets.bottom + 95 }]}>
        <Pressable style={styles.pillBtn} onPress={() => nav.navigate('SeekerJobs')}>
          <Ionicons name="list" size={20} color="#111" />
          <Text style={styles.pillText}>Siyahı</Text>
        </Pressable>
        <Pressable style={styles.pillBtn} onPress={() => setFilterOpen(true)}>
          <Ionicons name="search" size={20} color="#111" />
          <Text style={styles.pillText}>Axtar</Text>
          {hasActiveFilters ? <View style={styles.dotPill} /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20
  },
  floatingTopLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  floatingTopRight: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  floatingBottomRight: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  floatingBottomCenter: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
  },
  circleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  smCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignSelf: 'flex-end',
  },
  circleBtnActive: {
    backgroundColor: '#fee2e2',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  pillText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#111827',
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ff3b30",
    borderWidth: 1,
    borderColor: "#fff",
  },
  dotPill: {
    position: "absolute",
    top: 10,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ff3b30",
  }
});
