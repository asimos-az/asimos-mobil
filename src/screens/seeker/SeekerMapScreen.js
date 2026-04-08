import React, { useMemo, useState, useRef } from "react";
import { StyleSheet, View, Text, Pressable, ActivityIndicator, Dimensions, TextInput, ScrollView, Keyboard, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import { api } from "../../api/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const dailyOnly = route.params?.daily || false;

  const [jobs, setJobs] = useState(initialJobs || []);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const webRef = useRef(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState(null);
  const [q, setQ] = useState("");
  const [radius, setRadius] = useState(0);
  const [minWage, setMinWage] = useState("");
  const [maxWage, setMaxWage] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [unread, setUnread] = useState(0);
  const prevUnread = useRef(0);
  const [jobSelected, setJobSelected] = useState(false);

  const [addressSearch, setAddressSearch] = useState("");
  const [addressResults, setAddressResults] = useState([]);

  const searchAddress = async (text) => {
    setAddressSearch(text);
    if (!text.trim()) {
      setAddressResults([]);
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text + ', Azerbaijan')}&limit=5`;
      const res = await fetch(url, { headers: { 'User-Agent': 'AsimosApp/1.0' } });
      const data = await res.json();
      setAddressResults(data || []);
    } catch (e) {
      setAddressResults([]);
    }
  };

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

  const loadJobs = async (qOverride = null) => {
    setLoading(true);
    try {
      const effectiveQ = qOverride !== null ? String(qOverride || "").trim() : String(q || "").trim();
      const data = await api.listJobsWithSearch({ 
        q: effectiveQ,
        radius_m: radius > 0 ? radius : undefined,
        minWage: minWage || undefined,
        maxWage: maxWage || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        lat: (filterLocation || userLocation)?.lat,
        lng: (filterLocation || userLocation)?.lng,
        daily: dailyOnly || undefined,
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
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const notifEnabled = await AsyncStorage.getItem("ASIMOS_NOTIF_ENABLED_V2");
          const soundEnabled = await AsyncStorage.getItem("ASIMOS_NOTIF_SOUND_ENABLED");
          
          if (notifEnabled !== "0") {
             await Notifications.scheduleNotificationAsync({
               content: { 
                 title: "Yeni bildiriş", 
                 body: "Sizin üçün yeni bildiriş var.", 
                 sound: soundEnabled !== "0" 
               },
               trigger: null,
             });
          }
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
    const activeLoc = filterLocation || userLocation;
    const uLat = (typeof activeLoc?.lat === "number") ? Number(activeLoc.lat) : null;
    const uLng = (typeof activeLoc?.lng === "number") ? Number(activeLoc.lng) : null;

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
    .metro-marker {
      background:#E53935;color:white;border-radius:50%;
      width:26px;height:26px;display:flex;align-items:center;justify-content:center;
      font-weight:900;font-size:11px;border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    }
    .uni-marker {
      background:#7C3AED;color:white;border-radius:8px;
      width:26px;height:26px;display:flex;align-items:center;justify-content:center;
      font-size:13px;border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    }
    .custom-tooltip {
      background: white !important;
      border: none !important;
      border-radius: 10px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
      padding: 8px 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      font-size: 13px !important;
      color: #111827 !important;
      white-space: nowrap !important;
    }
    .custom-tooltip::before { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div id="info-card">
    <div class="card-handle"></div>
    <div class="card-close" id="card-close">✕</div>
    <div class="card-title" id="card-title"></div>
    <div class="card-meta">
       <span class="card-bg-icon">�</span>
       <span id="card-drive">Hesablanır...</span>
    </div>
    <div class="card-meta">
       <span class="card-bg-icon">🚶</span>
       <span id="card-walk">Hesablanır...</span>
    </div>
    <div class="card-meta">
       <span class="card-bg-icon">💰</span>
       <span id="card-wage"></span>
    </div>
    <div class="card-meta" id="card-metro-row" style="display:none;flex-direction:column;gap:3px;align-items:flex-start;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:8px"><span>🚇</span><span id="card-metro" style="font-size:13px;color:#374151"></span></div>
    </div>
    <div class="card-meta" id="card-uni-row" style="display:none;margin-bottom:16px">
      <span>🎓</span><span id="card-uni" style="font-size:13px;color:#374151"></span>
    </div>
    <div class="card-actions">
       <button class="card-btn primary" id="card-btn">Detallara bax</button>
       <button class="card-btn" id="gmap-btn" style="flex:0;padding:0 12px;background:#4285F4;color:white;margin-left:4px;display:flex;align-items:center;justify-content:center;border-radius:16px;font-size:12px;font-weight:700;gap:4px;">
         <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/><circle cx="12" cy="9" r="2.5" fill="#4285F4"/></svg>Maps
       </button>
       <button class="card-btn" id="waze-btn" style="flex:0;padding:0 12px;background:#33CCFF;color:white;margin-left:4px;display:flex;align-items:center;justify-content:center;border-radius:16px;font-size:12px;font-weight:700;gap:4px;">
         <svg width="16" height="16" viewBox="0 0 24 24"><ellipse cx="12" cy="11" rx="8" ry="7" fill="white" opacity="0.9"/><circle cx="9.5" cy="10" r="1.2" fill="#33CCFF"/><circle cx="14.5" cy="10" r="1.2" fill="#33CCFF"/><path d="M9 13.5 Q12 15.5 15 13.5" stroke="#33CCFF" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>Waze
       </button>
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
    window.flyTo = function(lat, lng) { map.flyTo([lat, lng], 15, {animate: true}); };

    if(uLat && uLng) {
      window.updateMe(uLat, uLng);
    }

    // Haversine distance in meters
    function haversine(lat1, lng1, lat2, lng2) {
      var R = 6371000;
      var dLat = (lat2-lat1)*Math.PI/180;
      var dLng = (lng2-lng1)*Math.PI/180;
      var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    function fmtDist(d) { return d < 1000 ? Math.round(d) + 'm' : (d/1000).toFixed(1) + 'km'; }

    var metros = [
      {name:'İçərişəhər',          lat:40.3658, lng:49.8338},
      {name:'Sahil',               lat:40.3714, lng:49.8422},
      {name:'28 May',              lat:40.3797, lng:49.8484},
      {name:'Gənclik',             lat:40.3880, lng:49.8519},
      {name:'Nəriman Nərimanov',   lat:40.3987, lng:49.8535},
      {name:'Ulduz',               lat:40.4048, lng:49.8659},
      {name:'Koroğlu',             lat:40.4113, lng:49.8768},
      {name:'Xalqlar Dostluğu',    lat:40.4062, lng:49.8809},
      {name:'Neftçilər',           lat:40.4062, lng:49.8874},
      {name:'Həzi Aslanov',        lat:40.4048, lng:49.9008},
      {name:'Əhmədli',             lat:40.4065, lng:49.9152},
      {name:'Hövsan',              lat:40.3895, lng:49.9395},
      {name:'8 Noyabr',            lat:40.3800, lng:49.8390},
      {name:'Memar Əcəmi',         lat:40.3945, lng:49.8215},
      {name:'İnşaatçılar',         lat:40.4000, lng:49.8228},
      {name:'Avtovağzal',          lat:40.4077, lng:49.8297},
      {name:'Dərnəgül',            lat:40.4127, lng:49.8388},
    ];

    var universities = [
      {name:'Bakı Dövlət Universiteti',       lat:40.3793, lng:49.8419},
      {name:'ADNSU',                           lat:40.3835, lng:49.8453},
      {name:'AzTU',                            lat:40.3862, lng:49.8523},
      {name:'UNEC',                            lat:40.3929, lng:49.8504},
      {name:'Xəzər Universiteti',              lat:40.3693, lng:49.8365},
      {name:'ATU (Tibb Universiteti)',         lat:40.4026, lng:49.8623},
      {name:'Pedaqoji Universitet',            lat:40.4068, lng:49.8476},
      {name:'ADA Universiteti',               lat:40.3705, lng:49.8397},
      {name:'Slavyan Universiteti',            lat:40.3824, lng:49.8444},
      {name:'Müdafiə Universiteti',            lat:40.3955, lng:49.8534},
    ];

    metros.forEach(function(st) {
      var icon = L.divIcon({ className: '', html: '<div class="metro-marker">M</div>', iconSize:[26,26], iconAnchor:[13,13] });
      L.marker([st.lat, st.lng], { icon: icon, zIndexOffset: 100 })
        .bindTooltip('<b>🚇 ' + st.name + '</b><br><span style="font-size:11px;color:#6B7280">Metro stansiyası</span>', {
          direction: 'top', offset: [0, -10], opacity: 1,
          className: 'custom-tooltip'
        })
        .addTo(map);
    });

    universities.forEach(function(u) {
      var icon = L.divIcon({ className: '', html: '<div class="uni-marker">🎓</div>', iconSize:[28,28], iconAnchor:[14,14] });
      L.marker([u.lat, u.lng], { icon: icon, zIndexOffset: 100 })
        .bindTooltip('<b>🎓 ' + u.name + '</b><br><span style="font-size:11px;color:#6B7280">Universitet</span>', {
          direction: 'top', offset: [0, -10], opacity: 1,
          className: 'custom-tooltip'
        })
        .addTo(map);
    });

    let currentRoute = null;
    let selectedJob = null;

    const jobBounds = [];

    jobs.forEach(j => {
      const jobIcon = L.divIcon({
        className: 'job-pin',
        html: '<div class="job-inner">💼</div>',
        iconSize: [34,34], iconAnchor: [17,17]
      });
        
      const m = L.marker([j.lat, j.lng], { icon: jobIcon }).addTo(map);
      j.marker = m; 
      jobBounds.push([j.lat, j.lng]);
      
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

    if(jobBounds.length > 1) {
      map.fitBounds(jobBounds, { padding: [60, 120] });
    } else if (jobBounds.length === 1) {
      map.setView(jobBounds[0], 16, { animate: true });
    } else if (uLat && uLng) {
      map.setView([uLat, uLng], 14, { animate: true });
    }

    function selectJob(job) {
      selectedJob = job;
      
      document.getElementById('card-title').innerText = job.title;
      document.getElementById('card-wage').innerText = job.wage || 'Razılaşma ilə';
      document.getElementById('card-drive').innerText = 'Hesablanır...';
      document.getElementById('card-walk').innerText = 'Hesablanır...';

      // Nearest 2 metro stations
      var sortedMetros = metros.slice().sort(function(a,b){ return haversine(job.lat,job.lng,a.lat,a.lng) - haversine(job.lat,job.lng,b.lat,b.lng); });
      var metroText = sortedMetros.slice(0,2).map(function(m){ return m.name + ' (' + fmtDist(haversine(job.lat,job.lng,m.lat,m.lng)) + ')'; }).join('  •  ');
      document.getElementById('card-metro').innerText = metroText;
      document.getElementById('card-metro-row').style.display = 'flex';

      // Nearest university
      var nearUni = universities.slice().sort(function(a,b){ return haversine(job.lat,job.lng,a.lat,a.lng) - haversine(job.lat,job.lng,b.lat,b.lng); })[0];
      document.getElementById('card-uni').innerText = nearUni.name + ' (' + fmtDist(haversine(job.lat,job.lng,nearUni.lat,nearUni.lng)) + ')';
      document.getElementById('card-uni-row').style.display = 'flex';

      document.getElementById('info-card').className = 'visible';
      send('jobSelected', true);
      
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
          let distStr = distM < 1000 ? Math.round(distM) + ' m' : (distM/1000).toFixed(1) + ' km';
          // Driving time from OSRM (car profile)
          const driveMin = Math.round(r.summary.totalTime / 60);
          document.getElementById('card-drive').innerText = distStr + ' • ~' + driveMin + ' dəq';
          // Walking time: 5 km/h = 83.3 m/min
          const walkMin = Math.round(distM / 83.3);
          const walkHr = Math.floor(walkMin / 60);
          const walkRem = walkMin % 60;
          const walkStr = walkHr > 0 ? walkHr + ' saat ' + (walkRem > 0 ? walkRem + ' dəq' : '') : walkMin + ' dəq';
          document.getElementById('card-walk').innerText = distStr + ' • ~' + walkStr;
        }).addTo(map);
      } else {
        document.getElementById('card-drive').innerText = 'Məsafə naməlumdur';
        document.getElementById('card-walk').innerText = '';
      }
    }

    document.getElementById('card-btn').addEventListener('click', () => {
      if(selectedJob) send('openJob', selectedJob.id);
    });
    document.getElementById('gmap-btn').addEventListener('click', () => {
      if(selectedJob) send('openGmap', { lat: selectedJob.lat, lng: selectedJob.lng });
    });
    document.getElementById('waze-btn').addEventListener('click', () => {
      if(selectedJob) send('openWaze', { lat: selectedJob.lat, lng: selectedJob.lng });
    });
    
    document.getElementById('card-close').addEventListener('click', () => {
      document.getElementById('info-card').className = '';
      send('jobSelected', false);
      if(currentRoute) { map.removeControl(currentRoute); currentRoute = null; }
    });

  </script>
</body>
</html>`;
  }, [jobs, userLocation, filterLocation]);

  const hasActiveFilters = !!(q?.trim() || minWage || maxWage || (selectedCategories?.length) || radius > 0);

  return (
    <View style={styles.container}>


      <WebView
        ref={webRef}
        source={{ html }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onMessage={(event) => {
          try {
             const data = JSON.parse(event.nativeEvent.data);
             if (data.type === 'jobSelected') {
                setJobSelected(data.payload);
             }
             if (data.type === 'openJob') {
                const fullJob = jobs.find(j => j.id === data.payload);
                if (fullJob) nav.navigate('JobDetail', { job: fullJob });
             }
             if (data.type === 'openGmap') {
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${data.payload.lat},${data.payload.lng}`);
             }
             if (data.type === 'openWaze') {
                Linking.openURL(`https://waze.com/ul?ll=${data.payload.lat},${data.payload.lng}&navigate=yes`);
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

      <View style={[styles.floatingTopLeft, { top: insets.top + 16, right: 16, flexDirection: 'row', gap: 12 }]}>
        <Pressable style={styles.circleBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </Pressable>
        
        <View style={{ flex: 1, zIndex: 50 }}>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={{ marginLeft: 16 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ünvan axtar..."
              value={addressSearch}
              onChangeText={searchAddress}
              returnKeyType="search"
            />
            {addressSearch.length > 0 && (
              <Pressable onPress={() => { setAddressSearch(''); setAddressResults([]); Keyboard.dismiss(); }} style={{ padding: 12 }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {addressResults.length > 0 && (
            <View style={styles.searchResults}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                {addressResults.map((r, i) => (
                  <Pressable
                    key={i}
                    style={styles.searchResultItem}
                    onPress={() => {
                      const lat = Number(r.lat);
                      const lon = Number(r.lon);
                      if (webRef.current) {
                        webRef.current.injectJavaScript(`window.flyTo(${lat}, ${lon}); true;`);
                      }
                      setAddressSearch(r.display_name.split(',')[0]);
                      setAddressResults([]);
                      Keyboard.dismiss();
                    }}
                  >
                    <Text style={styles.searchResultTitle} numberOfLines={1}>
                      {r.name || r.display_name.split(',')[0]}
                    </Text>
                    <Text style={styles.searchResultSub} numberOfLines={2}>
                      {r.display_name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
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

      {!jobSelected && (
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

      </View>
      )}

      <View style={[styles.floatingBottomCenter, { bottom: insets.bottom + 95 }]}>
        <Pressable style={styles.pillBtn} onPress={() => nav.goBack()}>
          <Ionicons name="list" size={20} color="#111" />
          <Text style={styles.pillText}>Siyahı</Text>
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
  searchInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
  },
  searchBarContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 26,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  searchResults: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  searchResultSub: {
    fontSize: 13,
    color: '#6B7280',
  }
});
