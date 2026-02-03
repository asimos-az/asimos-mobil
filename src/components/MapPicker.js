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

    // Default to user location if available, otherwise fallback to hardcoded Baku
    const initLat = Number(initial?.lat ?? uLat ?? 40.4093);
    const initLng = Number(initial?.lng ?? uLng ?? 49.8671);
    const initAddress = initial?.address ?? "";
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
    html,body{margin:0;padding:0;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#fff}
    
    #map{position:absolute;left:0;right:0;top:0;bottom:0;width:100%;height:100%;z-index:0}

    /* Floating Search Bar */
    #top-bar {
      position:absolute; top:calc(var(--safeTop) + 16px); left:16px; right:16px; z-index:1000;
      display:flex; gap:10px;
    }
    #back-btn, #search-box {
      background:rgba(255,255,255,0.95);
      border-radius:50px; /* Fully rounded */
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    #back-btn {
      width:44px; height:44px; display:flex; align-items:center; justifyContent:center;
      border:none; color:#111827; font-size:24px; cursor:pointer;
    }
    #search-box {
      flex:1; display:flex; align-items:center; padding:0 16px; height:44px;
    }
    #q {
      border:none; outline:none; background:transparent; font-size:16px; width:100%; color:#111827;
    }
    
    /* Center Pin (Uber style) */
    #center-pin {
      position:absolute; top:50%; left:50%; width:4px; height:4px; margin-top:-2px; margin-left:-2px;
      z-index:500; pointer-events:none;
    }
    #pin-icon {
      position:absolute; bottom:0; left:50%; transform:translateX(-50%);
      width:32px; height:32px; color:#111827;
      /* Custom SVG or CSS shape for pin */
    }

    /* Bottom Card */
    #bottom-card {
      position:absolute; bottom:calc(var(--safeBottom) + 20px); left:16px; right:16px; 
      z-index:1000; background:#fff; border-radius:20px; padding:16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
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
      border-radius:14px; font-size:16px; font-weight:800; text-align:center;
    }
    
  </style>
</head>
<body>
  <div id="map"></div>
  
  <div id="center-pin">
    <div id="pin-icon">
      <svg width="32" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37258 18.6274 0 12 0ZM12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5Z" fill="#111827"/>
      </svg>
    </div>
  </div>

  <div id="top-bar">
    <button id="back-btn">←</button>
    <div id="search-box">
      <input id="q" placeholder="Axtar..." enterkeyhint="search" />
    </div>
  </div>

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
    // Utils
    function send(type, payload) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload })); } catch(e){}
    }
    window.onerror = function (m) { send('error', m); };

    const API_BASE = ${apiBaseJSON};
    const initLat = ${initLat};
    const initLng = ${initLng};

    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([initLat, initLng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    // Initial user location marker (blue dot)
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
    
    // Reverse Geocode Logic
    let debounceTimer = null;
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
    }

    // Map Move Logic
    function onMapMoveEnd() {
      const center = map.getCenter();
      reverseGeocode(center.lat, center.lng);
    }
    
    map.on('moveend', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(onMapMoveEnd, 500);
    });
    
    // Run once on init
    reverseGeocode(initLat, initLng);

    // Search Logic
    document.getElementById('q').addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = e.target.value.trim();
        if(!q) return;
        
        try {
          const url = API_BASE + '/geo/search?q=' + encodeURIComponent(q);
          // or use nominatim direct if backend not available: 
          // const url = 'https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q);
          const res = await fetch(url);
          const data = await res.json();
          if(data && data[0]) {
             const lat = Number(data[0].lat);
             const lon = Number(data[0].lon);
             map.setView([lat, lon], 16);
          } else {
             alert('Tapılmadı');
          }
        } catch(e) { alert('Xəta'); }
      }
    });

    // Buttons
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
