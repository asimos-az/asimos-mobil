import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";
import { Colors } from "../../theme/colors";

export default function JobAlertsScreen({ navigation }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAlerts = async () => {
        try {
            const data = await api.listMyAlerts();
            setAlerts(data || []);
        } catch (e) {
            console.error(e);
            Alert.alert("Xəta", "Bildirişləri yükləmək mümkün olmadı.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAlerts();
        }, [])
    );

    const handleDelete = (id) => {
        Alert.alert("Silmək", "Bu bildirişi silmək istəyirsiniz?", [
            { text: "Ləğv et", style: "cancel" },
            {
                text: "Sil",
                style: "destructive",
                onPress: async () => {
                    try {
                        await api.deleteAlert(id);
                        setAlerts((prev) => prev.filter((a) => a.id !== id));
                    } catch (e) {
                        Alert.alert("Xəta", "Silmək mümkün olmadı.");
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }) => {
        return (
            <View style={styles.card}>
                <View style={styles.content}>
                    <Text style={styles.title}>
                        {item.query ? `"${item.query}"` : "Bütün işlər"}
                    </Text>
                    <Text style={styles.details}>
                        {item.min_wage ? `${item.min_wage} AZN+` : "Maaş: Hər hansı"}
                        {item.job_type ? ` • ${item.job_type === 'permanent' ? 'Daimi' : 'Müvəqqəti'}` : ""}
                        {item.radius_m ? ` • ${Math.round(item.radius_m / 1000)}km radius` : ""}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error || "red"} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={alerts}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>Hələ heç bir bildiriş yaratmamısınız.</Text>
                        </View>
                    )
                }
                contentContainerStyle={{ padding: 16 }}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("CreateJobAlert")}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    card: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    content: { flex: 1 },
    title: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
    details: { fontSize: 14, color: "#6B7280" },
    deleteBtn: { padding: 8 },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        backgroundColor: Colors.primary || "#2563EB",
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    empty: { alignItems: "center", marginTop: 40 },
    emptyText: { color: "#9CA3AF" },
});
