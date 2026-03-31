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
    const uLat = (typeof userLocation?.lat === "number") ? Number(userLocation.lat) : null;
    const uLng = (typeof userLocation?.lng === "number") ? Number(userLocation.lng) : null;

    const initLat = Number(initial?.lat ?? uLat ?? 40.4093);
    const initLng = Number(initial?.lng ?? uLng ?? 49.8671);
    const initAddress = initial?.address ?? "";
    const apiBase = String(API_BASE_URL || "").replace(/\/$/, "");

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
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#fff}
    
    #map{position:absolute;left:0;right:0;top:0;bottom:0;width:100%;height:100%;z-index:0}

    /* Floating Search Bar */
    #top-bar {
      position:absolute; top:calc(var(--safeTop) + 16px); left:16px; right:16px; z-index:1000;
      display:flex; gap:10px; flex-direction: column;
    }
    #search-row {
      display:flex; gap:10px; width:100%; height:48px;
    }
    #back-btn, #search-box {
      background:rgba(255,255,255,0.95);
      border-radius:24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    #back-btn {
      width:48px; height:48px; display:flex; align-items:center; justify-content:center;
      border:none; color:#111827; cursor:pointer; padding:0;
    }
    #back-btn svg { width:24px; height:24px; }
    
    #search-box {
      flex:1; display:flex; align-items:center; padding:0 16px; margin:0; border:none; height:48px;
    }
    #q {
      border:none; outline:none; background:transparent; font-size:16px; width:100%; color:#111827;
      /* Removes clear icon in WebKit */
      -webkit-appearance: none;
    }

    /* Search Results Dropdown */
    #search-results {
      background:rgba(255,255,255,0.98);
      border-radius:16px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      overflow:hidden; display:none; flex-direction:column;
      max-height: 250px; overflow-y: auto;
    }
    .result-item {
      padding: 12px 16px; border-bottom: 1px solid #f3f4f6;
      font-size: 14px; color: #374151; cursor: pointer;
      line-height: 1.4;
    }
    .result-item:last-child { border-bottom: none; }
    .result-item strong { display: block; color: #111827; font-size: 15px; margin-bottom: 2px; }
    .result-item:active { background: #f3f4f6; }

    #layer-toggle {
      position:absolute; top:calc(var(--safeTop) + 80px); right:16px; z-index:1000;
      background:rgba(255,255,255,0.95);
      border-radius:24px; width:48px; height:48px;
      display:flex; align-items:center; justify-content:center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      border:none; font-size:22px; cursor:pointer;
    }
    
    /* Center Pin */
    #center-pin {
      position:absolute; top:50%; left:50%; width:4px; height:4px; margin-top:-2px; margin-left:-2px;
      z-index:500; pointer-events:none;
    }
    #pin-icon {
      position:absolute; bottom:0; left:50%; transform:translateX(-50%);
      width:32px; height:42px; color:#111827;
    }

    /* Bottom Card */
    #bottom-card {
      position:absolute; bottom:calc(var(--safeBottom) + 20px); left:16px; right:16px; 
      z-index:1000; background:#fff; border-radius:24px; padding:16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      display:flex; flex-direction:column; gap:12px;
    }
    #address-row {
      display:flex; flex-direction:row; align-items:flex-start; gap:12px;
    }
    #addr-icon { font-size:20px; color:#6b7280; margin-top:2px; }
    #address-text { font-size:16px; font-weight:700; color:#111827; line-height:1.4; }
    #coord-text { font-size:12px; color:#9ca3af; margin-top:2px; }

    #confirm-btn {
      width:100%; background:#111827; color:#fff; border:none; padding:16px;
      border-radius:16px; font-size:16px; font-weight:800; text-align:center;
    }

    .job-marker {
      width: 14px; height: 14px; background: #D4F06A; border: 2px solid #111827;
      border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div id="center-pin">
    <div id="pin-icon">
      <svg width="32" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37258 18.6274 0 12 0ZM12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5Z" fill="#111827"/>
      </svg>
    </div>
  </div>

  <div id="top-bar">
    <div id="search-row">
      <button id="back-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </button>
      <form id="search-box" action="javascript:void(0);">
        <input type="search" id="q" placeholder="Axtar..." autocomplete="off" autocorrect="off" spellcheck="false" />
      </form>
    </div>
    <div id="search-results"></div>
  </div>

  <button id="layer-toggle">🗺️</button>

  <div id="bottom-card">
    <div id="address-row">
      <div id="addr-icon">📍</div>
      <div style="flex:1">
        <div id="address-text">Yüklənir...</div>
        <div id="coord-text"></div>
      </div>
    </div>
    <button id="confirm-btn">Bu lokasiyanı seç</button>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    function send(type, payload) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload })); } catch(e){}
    }
    window.onerror = function (m) { send('error', m); };

    const API_BASE = ${apiBaseJSON};
    const initLat = ${initLat};
    const initLng = ${initLng};

    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([initLat, initLng], 14);
    
    // Map Layers
    const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
    
    let isSatellite = false;
    standardLayer.addTo(map);

    document.getElementById('layer-toggle').addEventListener('click', () => {
      if (isSatellite) {
        map.removeLayer(satelliteLayer);
        standardLayer.addTo(map);
      } else {
        map.removeLayer(standardLayer);
        satelliteLayer.addTo(map);
      }
      isSatellite = !isSatellite;
    });

    // User Location
    const uLat = ${uLatJs};
    const uLng = ${uLngJs};
    if (uLat !== null && uLng !== null) {
      const userIcon = L.divIcon({
        className: 'user-dot',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.2)"></div>',
        iconSize: [16,16], iconAnchor: [8,8]
      });
      L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
    }

    let selected = { lat: initLat, lng: initLng, address: ${initAddressJSON} || '' };
    
    // Reverse Geocode
    let debounceTimer = null;
    let jobMarkers = [];
    
    async function fetchNearbyJobs(lat, lng) {
      try {
        const url = API_BASE + '/jobs?lat=' + lat + '&lng=' + lng + '&radius_m=50000';
        const res = await fetch(url);
        const data = await res.json();
        
        // Remove old markers
        jobMarkers.forEach(m => map.removeLayer(m));
        jobMarkers = [];
        
        let jobs = Array.isArray(data) ? data : data?.items || [];
        
        if (jobs.length > 0) {
          const jobIcon = L.divIcon({
            className: 'job-marker',
            iconSize: [14,14], iconAnchor: [7,7]
          });
          jobs.forEach(j => {
            if (j.location_lat && j.location_lng) {
              const m = L.marker([j.location_lat, j.location_lng], { icon: jobIcon }).addTo(map);
              jobMarkers.push(m);
            }
          });
        }
      } catch(e) { }
    }

    async function reverseGeocode(lat, lng) {
      document.getElementById('address-text').innerText = 'Yüklənir...';
      document.getElementById('coord-text').innerText = lat.toFixed(5) + ', ' + lng.toFixed(5);
      
      try {
        const url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1';
        const res = await fetch(url, { headers: { 'User-Agent': 'AsimosApp/1.0' } });
        const data = await res.json();
        const addr = data.display_name || 'Naməlum ünvan';
        
        selected = { lat, lng, address: addr };
        document.getElementById('address-text').innerText = addr.split(',').slice(0, 2).join(',');
      } catch(e) {
        selected = { lat, lng, address: '' };
        document.getElementById('address-text').innerText = 'Seçilən lokasiya';
      }
      send('updated', selected);
      
      // Fetch nearby jobs (50km radius)
      fetchNearbyJobs(lat, lng);
    }

    function onMapMoveEnd() {
      const center = map.getCenter();
      reverseGeocode(center.lat, center.lng);
    }
    
    map.on('moveend', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(onMapMoveEnd, 500);
    });
    
    reverseGeocode(initLat, initLng);

    // Nominatim Search Dropdown Logic
    const qInput = document.getElementById('q');
    const resultsDiv = document.getElementById('search-results');
    let searchDebounce = null;

    async function doSearch(query) {
      if(!query) {
        resultsDiv.style.display = 'none';
        return;
      }
      try {
        const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ', Azerbaijan') + '&limit=5';
        const res = await fetch(url, { headers: { 'User-Agent': 'AsimosApp/1.0' } });
        const data = await res.json();
        
        if (data && data.length > 0) {
          resultsDiv.innerHTML = '';
          data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = '<strong>' + (item.name || item.display_name.split(',')[0]) + '</strong>' +
                            '<span>' + item.display_name + '</span>';
                            
            div.onclick = () => {
              const lat = Number(item.lat);
              const lon = Number(item.lon);
              map.setView([lat, lon], 16);
              resultsDiv.style.display = 'none';
              qInput.blur();
              qInput.value = item.display_name.split(',')[0];
            };
            resultsDiv.appendChild(div);
          });
          resultsDiv.style.display = 'flex';
        } else {
          resultsDiv.innerHTML = '<div class="result-item">Nəticə tapılmadı</div>';
          resultsDiv.style.display = 'flex';
        }
      } catch(e) {
        resultsDiv.innerHTML = '<div class="result-item">Axtarışda xəta oldu</div>';
        resultsDiv.style.display = 'flex';
      }
    }

    // Trigger search as user types
    qInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const val = e.target.value.trim();
      if(!val) {
        resultsDiv.style.display = 'none';
        return;
      }
      searchDebounce = setTimeout(() => doSearch(val), 600);
    });
    
    // Prevent default form submit
    document.getElementById('search-box').addEventListener('submit', (e) => {
      e.preventDefault();
      qInput.blur();
      doSearch(qInput.value.trim());
    });
    
    // Hide results when tapping outside
    map.on('click', () => {
      resultsDiv.style.display = 'none';
      qInput.blur();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
      send('cancel');
    });

    document.getElementById('confirm-btn').addEventListener('click', () => {
      send('pick', selected);
    });

    send('ready');
  </script>
</body>
</html>`;
  }, [initial?.lat, initial?.lng, initial?.address, userLocation?.lat, userLocation?.lng, safeBottom, safeTop]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <WebView
          style={{ flex: 1 }}
          originWhitelist={["*"]}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onLoadEnd={() => setWebReady(true)}
          onError={(e) => setWebError(e?.nativeEvent?.description)}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === "ready") setWebReady(true);
              if (msg.type === "cancel") onClose?.();
              if (msg.type === "pick") {
                onPicked?.({
                  lat: Number(msg.payload.lat),
                  lng: Number(msg.payload.lng),
                  address: msg.payload.address || "Seçilən lokasiya",
                });
                onClose?.();
              }
            } catch { }
          }}
        />
        {!webReady && !webError ? (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
