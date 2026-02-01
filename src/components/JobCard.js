import React from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

export function JobCard({ job, onPress, showDailyBadge = true }) {
    const isDaily = job.isDaily;

    // Format wage nicely
    const wageDisplay = job.wage ? job.wage.replace("AZN", "₼") : "—";

    // Format distance
    const distDisplay = typeof job.distanceM === "number"
        ? (job.distanceM > 1000 ? `${(job.distanceM / 1000).toFixed(1)} km` : `${job.distanceM} m`)
        : null;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            <View style={styles.topRow}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{job.title?.charAt(0)?.toUpperCase() || "İ"}</Text>
                </View>
                <View style={styles.titleCol}>
                    <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.company} numberOfLines={1}>{job.company || "Asimos İşəgötürən"}</Text>
                </View>
                {(showDailyBadge && isDaily) && (
                    <View style={styles.dailyBadge}>
                        <Ionicons name="flash" size={12} color="#fff" />
                        <Text style={styles.dailyText}>Gündəlik</Text>
                    </View>
                )}
            </View>

            <View style={styles.tagsRow}>
                {job.category ? (
                    <View style={[styles.tag, { backgroundColor: Colors.primarySoft }]}>
                        <Text style={[styles.tagText, { color: Colors.primary }]}>{job.category}</Text>
                    </View>
                ) : null}

                <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
                    <Text style={[styles.tagText, { color: Colors.subtext }]}>{wageDisplay}</Text>
                </View>

                {distDisplay && (
                    <View style={[styles.tag, { backgroundColor: "#ECFDF5" }]}>
                        <Ionicons name="location-sharp" size={10} color={Colors.success} style={{ marginRight: 2 }} />
                        <Text style={[styles.tagText, { color: Colors.success }]}>{distDisplay}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.desc} numberOfLines={2}>
                {job.description}
            </Text>

            <View style={styles.footer}>
                <Text style={styles.timeAgo}>Yeni</Text>
                <View style={styles.arrowBtn}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 24,
        marginBottom: 16,
        padding: 16,
        // Modern deep shadow
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.bg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    iconText: {
        fontSize: 20,
        fontWeight: "900",
        color: Colors.primary,
    },
    titleCol: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        fontSize: 17,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 2,
    },
    company: {
        fontSize: 13,
        color: Colors.muted,
        fontWeight: "600",
    },
    dailyBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F59E0B", // Amber
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 10,
        gap: 4,
    },
    dailyText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "800",
    },
    tagsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    tagText: {
        fontSize: 12,
        fontWeight: "700",
    },
    desc: {
        fontSize: 14,
        color: Colors.subtext,
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 12,
    },
    timeAgo: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.muted,
    },
    arrowBtn: {
        width: 32,
        height: 32,
        borderRadius: 99,
        backgroundColor: Colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
});
