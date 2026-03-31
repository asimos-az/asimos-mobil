import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { api } from "../../api/client";
import { Colors } from "../../theme/colors";
import { SafeScreen } from "../../components/SafeScreen";

export default function CreateJobAlertScreen({ navigation }) {
    const [query, setQuery] = useState("");
    const [minWage, setMinWage] = useState("");
    const [maxWage, setMaxWage] = useState("");
    
    // location state
    const [distance, setDistance] = useState(null); // null = "Ölkə üzrə", 1000, 5000, 10000
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState("");
    const [locLoading, setLocLoading] = useState(false);

    // categories state
    const [category, setCategory] = useState("");
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setCategoriesLoading(true);
                const res = await api.listCategories();
                const items = Array.isArray(res?.items) ? res.items : [];
                const parentCategories = [];
                for (const p of items) {
                    if (p?.name) parentCategories.push(String(p.name));
                }
                if (alive) setCategoryOptions(parentCategories); // only keep top-level for pills to avoid clutter
            } catch (e) {
                // ignore
            } finally {
                if (alive) setCategoriesLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (distance !== null) {
            (async () => {
                setLocLoading(true);
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    Alert.alert("İcazə yoxdur", "Xəritə/Məkan icazəsi verilməyib.");
                    setDistance(null);
                    setLocLoading(false);
                    return;
                }
                try {
                    let loc = await Location.getCurrentPositionAsync({});
                    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
                    // Optional: Reverse geocode to get name
                    let geo = await Location.reverseGeocodeAsync({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude
                    });
                    if (geo && geo.length > 0) {
                        const addr = geo[0];
                        setLocationName([addr.street, addr.city, addr.country].filter(Boolean).join(", "));
                    } else {
                        setLocationName("Cari Məkanınız");
                    }
                } catch(e) {
                    Alert.alert("Xəta", "Məkanı tapmaq mümkün olmadı");
                    setDistance(null);
                } finally {
                    setLocLoading(false);
                }
            })();
        } else {
            setLocation(null);
            setLocationName("");
        }
    }, [distance]);

    const handleCreate = async () => {
        if (!query && !minWage && !maxWage && !category && distance === null) {
            Alert.alert("Xəta", "Ən azı bir kriteriya daxil edin.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                query: query.trim() || null,
                category: category || null,
                min_wage: minWage ? Number(minWage) : null,
                max_wage: maxWage ? Number(maxWage) : null,
                job_type: null, // removing job_type according to Screenshot design
                location: distance !== null ? location : null,
                radius_m: distance !== null ? distance : null,
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

    const renderDistanceBtn = (val, label) => {
        const isActive = distance === val;
        return (
            <TouchableOpacity 
                style={[styles.distBtn, isActive && styles.distBtnActive]} 
                onPress={() => setDistance(val)}
            >
                <Text style={[styles.distText, isActive && styles.distTextActive]}>{label}</Text>
                {isActive && <View style={styles.distLine} />}
            </TouchableOpacity>
        );
    };

    return (
        <SafeScreen style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bildiriş Yarat</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Search */}
                <View style={styles.section}>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Məs: ofisiant"
                            placeholderTextColor={Colors.muted}
                        />
                    </View>
                </View>

                {/* Salary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Maaş (filter)</Text>
                    <View style={styles.row}>
                        <View style={{flex: 1}}>
                            <Text style={styles.subLabel}>Min</Text>
                            <View style={[styles.inputWrap, {marginTop: 6}]}>
                                <TextInput
                                    style={styles.input}
                                    value={minWage}
                                    onChangeText={setMinWage}
                                    placeholder="məs: 400"
                                    placeholderTextColor={Colors.muted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.subLabel}>Max</Text>
                            <View style={[styles.inputWrap, {marginTop: 6}]}>
                                <TextInput
                                    style={styles.input}
                                    value={maxWage}
                                    onChangeText={setMaxWage}
                                    placeholder="məs: 1200"
                                    placeholderTextColor={Colors.muted}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Distance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Məsafə</Text>
                    <View style={styles.distRow}>
                        {renderDistanceBtn(null, "Ölkə üzrə")}
                        {renderDistanceBtn(1000, "1km")}
                        {renderDistanceBtn(5000, "5km")}
                        {renderDistanceBtn(10000, "10km")}
                    </View>
                </View>

                {/* Categories */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kateqoriya</Text>
                    {categoriesLoading ? (
                        <ActivityIndicator />
                    ) : (
                        <View style={styles.pillsWrap}>
                            {categoryOptions.map(cat => {
                                const active = category === cat;
                                return (
                                    <TouchableOpacity 
                                        key={cat} 
                                        style={[styles.pill, active && styles.pillActive]}
                                        onPress={() => setCategory(active ? "" : cat)}
                                    >
                                        <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Location Box */}
                {distance !== null && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Filter lokasiyası</Text>
                        <View style={styles.locBox}>
                            {locLoading ? (
                                <ActivityIndicator size="small" color={Colors.text} />
                            ) : (
                                <Text style={styles.locBoxText}>{locationName || "Məkan təyin edilmədi"}</Text>
                            )}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitText}>Tətbiq et</Text>
                    )}
                </TouchableOpacity>

                <View style={{height: 40}} />

            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 16 
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
    closeBtn: {
        width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: Colors.border
    },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12 },
    
    subLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
    
    inputWrap: {
        backgroundColor: "transparent",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    input: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },

    distRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: Colors.border },
    distBtn: { paddingVertical: 12, paddingHorizontal: 4, position: 'relative' },
    distText: { fontSize: 14, fontWeight: '600', color: Colors.muted },
    distTextActive: { color: Colors.text, fontWeight: '800' },
    distLine: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: Colors.text },

    pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pillActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' },
    pillText: { fontSize: 13, fontWeight: '700', color: Colors.muted },
    pillTextActive: { color: '#065F46' },

    locBox: {
        backgroundColor: "transparent",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
        minHeight: 60,
        justifyContent: 'center'
    },
    locBoxText: { fontSize: 14, fontWeight: '700', color: Colors.text, lineHeight: 22 },

    submitBtn: {
        backgroundColor: Colors.text,
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 10
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: '800' }
});
