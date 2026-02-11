import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, Text, ActivityIndicator, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

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

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
  <style>
    html,body{margin:0;padding:0;height:100%;}
    #map{height:100%;width:100%}
    .leaflet-routing-container{display:none !important;}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const jLat = ${jLat};
    const jLng = ${jLng};
    const uLat = ${uLat};
    const uLng = ${uLng};

    // Custom Job Icon (Briefcase)
    const jobIcon = L.divIcon({
      className: 'job-pin',
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#16a34a;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:18px">💼</div>',
      iconSize: [32,32], iconAnchor: [16,16]
    });
    
    // Custom User Icon (Blue Dot)
    const userIcon = L.divIcon({
      className: 'user-pin',
      html: '<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3)"></div>',
      iconSize: [20,20], iconAnchor: [10,10]
    });

    const jobMarker = L.marker([jLat, jLng], { icon: jobIcon }).addTo(map);

    if(uLat && uLng) {
        L.marker([uLat, uLng], { icon: userIcon }).addTo(map);

        // Routing
        L.Routing.control({
            waypoints: [
                L.latLng(uLat, uLng),
                L.latLng(jLat, jLng)
            ],
            show: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            alternativeRoutes: true, // Enable alternatives
            createMarker: () => null, // We used our own markers
            lineOptions: { styles: [] } // We will draw manually to ensure colors
        }).on('routesfound', function(e) {
            // Draw each route with a different color
            const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']; // Blue, Purple, Orange, Green
            
            // Sort by distance maybe, or just iterate.
            // Reverse to draw main route last (on top) if needed, or just draw all.
            // Leaflet Routing Machine usually puts the 'selected' route first.
            
            e.routes.forEach((r, i) => {
                const color = colors[i % colors.length];
                const opacity = i === 0 ? 0.9 : 0.6; // Main route standard, alts transparent
                const weight = i === 0 ? 6 : 5;
                
                L.polyline(r.coordinates, {
                    color: color,
                    weight: weight,
                    opacity: opacity
                }).addTo(map);
            });
            
            // Adjust bounds to fit all
            // const bounds = L.latLngBounds([uLat, uLng], [jLat, jLng]); // Simple bounds
            // map.fitBounds(bounds, { padding: [50, 50] }); 
            // Routing machine auto fits usually
        }).addTo(map);
    } else {
        map.setView([jLat, jLng], 15);
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
