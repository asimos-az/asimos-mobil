import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { api } from "../../api/client";
import { Colors } from "../../theme/colors";

export default function CreateJobAlertScreen({ navigation }) {
    const [query, setQuery] = useState("");
    const [minWage, setMinWage] = useState("");
    const [jobType, setJobType] = useState("all"); // 'all', 'permanent', 'temporary'
    const [useLocation, setUseLocation] = useState(false);
    const [radius, setRadius] = useState(5000); // meters
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        if (useLocation) {
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("İcazə yoxdur", "Məkan icazəsi verilməyib.");
                    setUseLocation(false);
                    return;
                }
                let loc = await Location.getCurrentPositionAsync({});
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            })();
        }
    }, [useLocation]);

    const handleCreate = async () => {
        if (!query && !minWage && jobType === "all" && !useLocation) {
            Alert.alert("Xəta", "Ən azı bir kriteriya daxil edin.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                query: query,
                min_wage: minWage ? Number(minWage) : null,
                job_type: jobType === "all" ? null : jobType,
                location: useLocation ? location : null,
                radius_m: useLocation ? radius : null,
            };

            await api.createAlert(payload);
            Alert.alert("Uğurlu", "Bildiriş yaradıldı!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert("Xəta", e.message || "Xəta baş verdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
            {/* Query */}
            <Text style={styles.label}>Açar söz (Məs: Ofisiant)</Text>
            <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Axtarış sözü..."
            />

            {/* Min Wage */}
            <Text style={styles.label}>Minimum Maaş (AZN)</Text>
            <TextInput
                style={styles.input}
                value={minWage}
                onChangeText={setMinWage}
                placeholder="Məs: 500"
                keyboardType="numeric"
            />

            {/* Job Type */}
            <Text style={styles.label}>İş Rejimi</Text>
            <View style={styles.row}>
                {["all", "permanent", "temporary"].map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, jobType === t && styles.typeBtnActive]}
                        onPress={() => setJobType(t)}
                    >
                        <Text style={[styles.typeText, jobType === t && styles.typeTextActive]}>
                            {t === "all" ? "Fərqi yoxdur" : t === "permanent" ? "Daimi" : "Müvəqqəti"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Location Toggle */}
            <View style={[styles.row, { justifyContent: "space-between", marginTop: 20, marginBottom: 10 }]}>
                <Text style={styles.label}>Yaxınlıqda axtar (Məkan)</Text>
                <Switch
                    value={useLocation}
                    onValueChange={setUseLocation}
                    trackColor={{ false: "#767577", true: Colors.primary }}
                />
            </View>

            {useLocation && (
                <View style={styles.radiusBox}>
                    <Text style={styles.subLabel}>Radius: {Math.round(radius / 1000)} km</Text>
                    <Slider
                        style={{ width: "100%", height: 40 }}
                        minimumValue={1000}
                        maximumValue={50000}
                        step={1000}
                        value={radius}
                        onValueChange={setRadius}
                        minimumTrackTintColor={Colors.primary}
                        maximumTrackTintColor="#000000"
                    />
                    {location ? (
                        <Text style={styles.locText}>📍 Məkan təyin olundu</Text>
                    ) : (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    )}
                </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleCreate}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>Bildiriş Yarat</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#374151" },
    input: {
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    row: { flexDirection: "row", alignItems: "center" },
    typeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#E5E7EB",
        marginRight: 10,
    },
    typeBtnActive: { backgroundColor: Colors.primary },
    typeText: { color: "#374151", fontWeight: "500" },
    typeTextActive: { color: "#fff" },
    radiusBox: {
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    subLabel: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
    locText: { fontSize: 12, color: "green", marginTop: 5 },
    submitBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 20,
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
