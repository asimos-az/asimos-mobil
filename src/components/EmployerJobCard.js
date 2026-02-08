import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

export function EmployerJobCard({ job, onPress, onToggleStatus, loading, readonly = false }) {
    const isDaily = job.isDaily;

    const statusConfig = useMemo(() => ({
        open: {
            label: "Aktiv",
            color: "#16A34A",
            bg: "#DCFCE7",
            borderColor: "#BBF7D0",
            icon: "checkmark-circle"
        },
        pending: {
            label: "Yoxlanılır",
            color: "#D97706",
            bg: "#FEF3C7",
            borderColor: "#FDE68A",
            icon: "time"
        },
        closed: {
            label: "Bağlı",
            color: "#DC2626",
            bg: "#FEE2E2",
            borderColor: "#FECACA",
            icon: "lock-closed"
        },
    }), []);

    const status = String(job.status || "open").toLowerCase();
    const currentStatus = statusConfig[status] || statusConfig.open;
    const isClosed = status === "closed";

    const wageDisplay = job.wage ? job.wage.replace("AZN", "₼") : "—";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        >
            {/* Header: Title + Status */}
            <View style={styles.topRow}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{job.title?.charAt(0)?.toUpperCase() || "İ"}</Text>
                </View>
                <View style={styles.titleCol}>
                    <Text style={styles.title} numberOfLines={1}>{job.title}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: currentStatus.bg, borderColor: currentStatus.borderColor }]}>
                            <Ionicons name={currentStatus.icon} size={10} color={currentStatus.color} />
                            <Text style={[styles.statusText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
                        </View>
                        {isDaily && (
                            <View style={[styles.dailyBadge]}>
                                <Ionicons name="flash" size={10} color="#fff" />
                                <Text style={styles.dailyText}>Gündəlik</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Meta Tags */}
            <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
                    <Text style={[styles.tagText, { color: Colors.subtext }]}>{wageDisplay}</Text>
                </View>

                {job.category && (
                    <View style={[styles.tag, { backgroundColor: Colors.primarySoft }]}>
                        <Text style={[styles.tagText, { color: Colors.primary }]}>{job.category}</Text>
                    </View>
                )}

                {typeof job.notifyRadiusM === "number" && (
                    <View style={[styles.tag, { backgroundColor: "#ECFDF5" }]}>
                        <Ionicons name="radio-outline" size={10} color={Colors.success} style={{ marginRight: 2 }} />
                        <Text style={[styles.tagText, { color: Colors.success }]}>{job.notifyRadiusM}m Radius</Text>
                    </View>
                )}
            </View>

            {/* Actions Footer */}
            <View style={styles.footer}>
                {!readonly && (
                    <Pressable
                        style={[styles.actionBtn, isClosed ? styles.btnReopen : styles.btnClose]}
                        onPress={() => onToggleStatus(job)}
                        disabled={loading}
                    >
                        {isClosed ? (
                            <>
                                <Ionicons name="refresh" size={16} color="#16A34A" />
                                <Text style={[styles.actionText, { color: "#16A34A" }]}>Elanı Aç</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="lock-closed" size={16} color="#DC2626" />
                                <Text style={[styles.actionText, { color: "#DC2626" }]}>Elanı Bağla</Text>
                            </>
                        )}
                    </Pressable>
                )}

                <View style={styles.viewBtn}>
                    <Text style={styles.viewText}>Bax</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
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
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    pressed: {
        transform: [{ scale: 0.99 }],
        opacity: 0.95,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
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
        marginBottom: 6,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
    },
    dailyBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F59E0B",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
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
        marginBottom: 16,
    },
    tag: {
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
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 12,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
    },
    btnClose: { backgroundColor: "#FEE2E2" },
    btnReopen: { backgroundColor: "#DCFCE7" },
    actionText: {
        fontSize: 13,
        fontWeight: "700",
    },
    viewBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    viewText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.muted,
    },
});
