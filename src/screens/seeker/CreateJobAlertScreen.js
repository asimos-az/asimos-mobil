import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Slider from "@react-native-community/slider";
import { api } from "../../api/client";
import { Colors } from "../../theme/colors";
import { SelectField } from "../../components/SelectField";
import { SafeScreen } from "../../components/SafeScreen";

export default function CreateJobAlertScreen({ navigation }) {
    const [keywordInput, setKeywordInput] = useState("");
    const [keywords, setKeywords] = useState([]);
    const [minWage, setMinWage] = useState("");
    const [jobType, setJobType] = useState("all"); // 'all', 'permanent', 'temporary'
    const [useLocation, setUseLocation] = useState(false);
    const [radius, setRadius] = useState(5000); // meters
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);

    const [category, setCategory] = useState("");
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setCategoriesLoading(true);
                const res = await api.listCategories();
                const items = Array.isArray(res?.items) ? res.items : [];
                const out = [];
                for (const p of items) {
                    if (p?.name) out.push(String(p.name));
                    const children = Array.isArray(p?.children) ? p.children : [];
                    for (const c of children) {
                        if (c?.name) out.push(`↳ ${String(c.name)}`);
                    }
                }
                if (alive) setCategoryOptions(out);
            } catch (e) {
                // ignore
            } finally {
                if (alive) setCategoriesLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

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

    const handleAddKeyword = () => {
        const val = keywordInput.trim();
        if (val && !keywords.includes(val)) {
            setKeywords([...keywords, val]);
        }
        setKeywordInput("");
    };

    const handleRemoveKeyword = (kw) => {
        setKeywords(keywords.filter(k => k !== kw));
    };

    const handleCreate = async () => {
        if (keywords.length === 0 && !minWage && jobType === "all" && !useLocation && !category) {
            Alert.alert("Xəta", "Ən azı bir kriteriya daxil edin.");
            return;
        }

        setLoading(true);
        try {
            const finalQuery = keywords.join(" ");
            const payload = {
                query: finalQuery || null,
                category: category || null,
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
        <SafeScreen style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bildiriş Yarat</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                
                <View style={styles.card}>
                    <Text style={styles.label}>Açar sözlər (Məs: Ofisiant, Barmen)</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                            value={keywordInput}
                            onChangeText={setKeywordInput}
                            onSubmitEditing={handleAddKeyword}
                            placeholder="Söz yaz və '+' bas..."
                            placeholderTextColor="#94A3B8"
                        />
                        <TouchableOpacity style={styles.addBtn} onPress={handleAddKeyword}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {keywords.length > 0 && (
                        <View style={styles.chipContainer}>
                            {keywords.map(kw => (
                                <View key={kw} style={styles.chip}>
                                    <Text style={styles.chipText}>{kw}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveKeyword(kw)}>
                                        <Ionicons name="close-circle" size={18} color="#64748B" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <SelectField
                        label="Kateqoriya"
                        value={category}
                        onChange={(v) => {
                            const raw = String(v || "");
                            setCategory(raw.startsWith("↳ ") ? raw.slice(2) : raw);
                        }}
                        placeholder="İstənilən kateqoriya"
                        options={categoryOptions}
                        loading={categoriesLoading}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Minimum Maaş (AZN)</Text>
                    <TextInput
                        style={styles.input}
                        value={minWage}
                        onChangeText={setMinWage}
                        placeholder="Məs: 500"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.card}>
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
                </View>

                <View style={[styles.card, { paddingVertical: 12 }]}>
                    <View style={[styles.row, { justifyContent: "space-between" }]}>
                        <Text style={[styles.label, { marginBottom: 0 }]}>Məkana görə axtarış</Text>
                        <Switch
                            value={useLocation}
                            onValueChange={setUseLocation}
                            trackColor={{ false: "#E2E8F0", true: "#0F172A" }}
                            thumbColor="#fff"
                        />
                    </View>

                    {useLocation && (
                        <View style={styles.radiusBox}>
                            <Text style={styles.subLabel}>Axtarış radiusu: <Text style={{ color: '#0F172A' }}>{Math.round(radius / 1000)} km</Text></Text>
                            <Slider
                                style={{ width: "100%", height: 40 }}
                                minimumValue={1000}
                                maximumValue={50000}
                                step={1000}
                                value={radius}
                                onValueChange={setRadius}
                                minimumTrackTintColor="#0F172A"
                                maximumTrackTintColor="#E2E8F0"
                                thumbTintColor="#0F172A"
                            />
                            {location ? (
                                <View style={styles.locIndicator}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.locText}>Məkan təyin olundu</Text>
                                </View>
                            ) : (
                                <ActivityIndicator size="small" color="#0F172A" style={{ marginTop: 10 }} />
                            )}
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.submitText}>Bildirişi Yadda Saxla</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, backgroundColor: '#F8FAFC' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    
    label: { fontSize: 14, fontWeight: "700", marginBottom: 10, color: "#64748B" },
    inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    input: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '600',
    },
    addBtn: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
    
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
    chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
    chipText: { fontSize: 14, fontWeight: '700', color: '#334155' },

    row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
    typeBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: '#F1F5F9',
        flexGrow: 1,
        alignItems: 'center'
    },
    typeBtnActive: { backgroundColor: "#0F172A", borderColor: '#0F172A' },
    typeText: { color: "#64748B", fontWeight: "700", fontSize: 14 },
    typeTextActive: { color: "#fff" },

    radiusBox: {
        paddingTop: 20,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9'
    },
    subLabel: { fontSize: 14, fontWeight: "600", color: '#64748B', marginBottom: 16 },
    locIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    locText: { fontSize: 13, fontWeight: '700', color: "#065F46" },

    submitBtn: {
        backgroundColor: "#D4F06A",
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 10,
    },
    submitText: { color: "#0F172A", fontSize: 16, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 0.5 },
});
