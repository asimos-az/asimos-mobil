import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, Text, ActivityIndicator, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BAKU_METROS, BAKU_UNIVERSITIES } from "../../constants/MapData";

export function JobMapScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { job, userLocation } = route.params || {};
    const [loading, setLoading] = React.useState(true);

    const html = useMemo(() => {
        const jLat = Number(job?.location?.lat);
        const jLng = Number(job?.location?.lng);
        const uLat = userLocation?.lat ? Number(userLocation.lat) : null;
        const uLng = userLocation?.lng ? Number(userLocation.lng) : null;

        if (!jLat || !jLng) return "";

        const titleString = JSON.stringify(job?.title || 'Vakansiya');
        const addrString = JSON.stringify(job?.location?.address || '');
        
        let displayWage = 'Razılaşma ilə';
        if (job?.wage) {
            const raw = String(job.wage).replace(/AZN|₼/gi, "").trim();
            if (raw) displayWage = raw + " AZN";
        }
        const wageString = JSON.stringify(displayWage);

        const metroData = JSON.stringify(BAKU_METROS);
        const uniData = JSON.stringify(BAKU_UNIVERSITIES);

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;background-color:#f3f4f6;}
    #map{height:100%;width:100%}
    .landmark-icon { display: flex; align-items: center; justify-content: center; font-size: 20px; }
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

      const map = L.map('map', { zoomControl: true, attributionControl: false });
      
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);

      // Custom Icons
      const jobIcon = L.divIcon({
        className: 'job-pin',
        html: '<div style="width:32px;height:32px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:18px">💼</div>',
        iconSize: [32,32], iconAnchor: [16,16]
      });
      const userIcon = L.divIcon({
        className: 'user-pin',
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3)"></div>',
        iconSize: [20,20], iconAnchor: [10,10]
      });
      const metroIcon = L.divIcon({ className: 'landmark-icon', html: '<span>🚇</span>', iconSize: [24, 24], iconAnchor: [12, 12] });
      const uniIcon = L.divIcon({ className: 'landmark-icon', html: '<span>🎓</span>', iconSize: [24, 24], iconAnchor: [12, 12] });

      // Add Job Marker
      if (jLat && jLng) {
        const jobMarker = L.marker([jLat, jLng], { icon: jobIcon, zIndexOffset: 1000 }).addTo(map);
        const jTitleProps = ${titleString};
        const jAddressProps = ${addrString};
        const jWageProps = ${wageString};
        const popupHtml = '<div style="font-family:sans-serif; text-align:center;"><strong style="font-size:14px;">' + jTitleProps + '</strong><br/><span style="color:#6B7280; font-size:12px;">' + jAddressProps + '</span><br/><span style="color:#16a34a; font-weight:900; font-size:13px; margin-top:4px; display:inline-block;">' + jWageProps + '</span></div>';
        jobMarker.bindPopup(popupHtml).openPopup();
      }

      // Add User Marker
      if (uLat && uLng) {
        L.marker([uLat, uLng], { icon: userIcon }).addTo(map);
      }

      // Add Landmarks
      try {
        const metros = ${metroData};
        const unis = ${uniData};
        if (Array.isArray(metros)) {
          metros.forEach(m => L.marker([m.lat, m.lng], { icon: metroIcon, opacity: 0.8 }).addTo(map).bindPopup(m.name));
        }
        if (Array.isArray(unis)) {
          unis.forEach(u => L.marker([u.lat, u.lng], { icon: uniIcon, opacity: 0.8 }).addTo(map).bindPopup(u.name));
        }
      } catch (landErr) {}

      // Fit View
      if (uLat && uLng && jLat && jLng) {
          const dist = map.distance([uLat, uLng], [jLat, jLng]);
          if (dist > 100000) { // if > 100km (e.g. emulator is in California), just center on job
              map.setView([jLat, jLng], 14);
          } else {
              const bounds = L.latLngBounds([[uLat, uLng], [jLat, jLng]]);
              map.fitBounds(bounds, { padding: [50, 50] });
          }
      } else if (jLat && jLng) {
          map.setView([jLat, jLng], 15);
      } else {
          map.setView([40.4093, 49.8671], 12);
      }
    } catch (err) {
      document.body.innerHTML = '<div style="padding:20px; color:#ef4444; font-size:16px; text-align:center;">Xəritə yüklənərkən xəta baş verdi</div>';
    }

  </script>
</body>
</html>`;
    }, [job, userLocation]);

    function openGoogleMaps() {
        const lat = job?.location?.lat;
        const lng = job?.location?.lng;
        if (!lat || !lng) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        Linking.openURL(url).catch(() => { });
    }

    function openWaze() {
        const lat = job?.location?.lat;
        const lng = job?.location?.lng;
        if (!lat || !lng) return;
        const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        Linking.openURL(url).catch(() => { });
    }

    return (
        <SafeScreen>
            <View style={styles.header}>
                <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                    <Ionicons name="close-circle" size={32} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>Xəritə</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.body}>
                <WebView
                    source={{ html }}
                    style={{ flex: 1 }}
                    onLoadEnd={() => setLoading(false)}
                />
                {loading && (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}

                {/* Navigation Buttons */}
                <View style={styles.footer}>
                    <Pressable onPress={openGoogleMaps} style={[styles.navBtn, { backgroundColor: '#4285F4' }]}>
                        <Ionicons name="map" size={20} color="#fff" />
                        <Text style={styles.navBtnText}>Google Maps</Text>
                    </Pressable>
                    <Pressable onPress={openWaze} style={[styles.navBtn, { backgroundColor: '#33CCFF' }]}>
                        <Ionicons name="navigate" size={20} color="#fff" />
                        <Text style={styles.navBtnText}>Waze</Text>
                    </Pressable>
                </View>
            </View>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    title: {
        fontSize: 18,
        fontWeight: "900",
        color: Colors.text,
    },
    body: {
        flex: 1,
        backgroundColor: "#fff",
        position: 'relative',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    navBtnText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    }
});
