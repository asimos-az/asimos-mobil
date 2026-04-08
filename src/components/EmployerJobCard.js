import React, { useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

export function EmployerJobCard({ job, onPress, onToggleStatus, onEdit, loading, readonly = false }) {
    const isDaily = job.isDaily;

    const statusConfig = useMemo(() => ({
        open: {
            label: "Aktiv",
            color: "#16A34A",
            bg: "#F0FDF4",
            borderColor: "#BBF7D0",
            icon: "checkmark"
        },
        pending: {
            label: "Yoxlanılır",
            color: "#D97706",
            bg: "#FEFCE8",
            borderColor: "#FEF08A",
            icon: "time-outline"
        },
        scheduled: {
            label: "Planlı",
            color: "#2563EB",
            bg: "#EFF6FF",
            borderColor: "#BFDBFE",
            icon: "calendar-outline"
        },
        closed: {
            label: "Bağlı",
            color: "#DC2626",
            bg: "#FEF2F2",
            borderColor: "#FECACA",
            icon: "lock-closed"
        },
        rejected: {
            label: "Rədd edilib",
            color: "#DC2626",
            bg: "#FEF2F2",
            borderColor: "#FECACA",
            icon: "close-circle-outline"
        },
    }), []);

    const status = String(job.status || "open").toLowerCase();
    const currentStatus = statusConfig[status] || statusConfig.open;
    const isClosed = status === "closed";

    const wageDisplay = job.wage ? (String(job.wage).replace(/AZN|₼/gi, "").trim() + " AZN") : "—";
    const typeLabel = job.category || "Vakansiya";

    let radiusDisplay = "";
    if (typeof job.notifyRadiusM === "number") {
        let r = job.notifyRadiusM;
        if (r >= 1000) {
            let km = r / 1000;
            radiusDisplay = (Number.isInteger(km) ? km : km.toFixed(1)) + " km Radius";
        } else {
            radiusDisplay = r + " m Radius";
        }
    }

    const createdDate = job.publishedAt || job.published_at || job.createdAt || job.created_at;

    function formatDateTime(ts) {
        const d = new Date(ts);
        if (isNaN(d.getTime())) return null;
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
    }

    let badgeRightText = isDaily ? "Gündəlik iş" : "Elan";
    if (createdDate) {
        const dateStr = formatDateTime(createdDate);
        if (dateStr) badgeRightText = dateStr + " • " + badgeRightText;
    }

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
        >
            <View style={styles.badgeContainer}>
                <View style={[styles.statePill, { backgroundColor: currentStatus.bg, borderColor: currentStatus.borderColor }]}>
                    <Ionicons name={currentStatus.icon} size={14} color={currentStatus.color} />
                    <Text style={[styles.stateText, { color: currentStatus.color }]}>{currentStatus.label}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.title} numberOfLines={1}>{job.title || "Vakansiya"}</Text>
                    <Text style={styles.statusText} numberOfLines={1}>
                        {badgeRightText}
                    </Text>
                </View>

                <View style={styles.rowTopMargin}>
                    <View style={styles.leftCol}>
                        <Text style={styles.meta} numberOfLines={1}>{typeLabel}</Text>
                        {radiusDisplay ? (
                            <Text style={styles.meta} numberOfLines={1}>{radiusDisplay}</Text>
                        ) : null}
                    </View>
                    <View style={styles.rightCol}>
                        <Text style={styles.amount} numberOfLines={1}>{wageDisplay}</Text>
                    </View>
                </View>

                {status === 'rejected' && job.rejectionReason && (
                    <View style={styles.rejectionBox}>
                        <Text style={styles.rejectionTitle}>Rədd səbəbi:</Text>
                        <Text style={styles.rejectionText}>{job.rejectionReason}</Text>
                    </View>
                )}
                
                {/* Actions Footer */}
                {!readonly && (
                    <View style={styles.footer}>
                        <Pressable
                            style={[styles.actionBtn, styles.btnEdit]}
                            onPress={() => onEdit?.(job)}
                            disabled={loading}
                        >
                            <Ionicons name="create-outline" size={14} color={Colors.primary} />
                            <Text style={[styles.actionText, { color: Colors.primary }]}>Redaktə et</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.actionBtn, isClosed ? styles.btnReopen : styles.btnClose]}
                            onPress={() => onToggleStatus(job)}
                            disabled={loading}
                        >
                            {isClosed ? (
                                <>
                                    <Ionicons name="refresh" size={14} color="#16A34A" />
                                    <Text style={[styles.actionText, { color: "#16A34A" }]}>Elanı Aç</Text>
                                </>
                            ) : (
                                <>
                                    <Ionicons name="lock-closed" size={14} color="#DC2626" />
                                    <Text style={[styles.actionText, { color: "#DC2626" }]}>Elanı Bağla</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 20,
    },
    pressed: {
        opacity: 0.7,
    },
    badgeContainer: {
        marginBottom: -12,
        paddingHorizontal: 16,
        zIndex: 10,
    },
    statePill: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
    },
    stateText: {
        fontSize: 13,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    rowTopMargin: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    leftCol: {
        flex: 1,
        gap: 4,
    },
    rightCol: {
        marginLeft: 12,
        alignItems: "flex-end",
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 12,
    },
    statusText: {
        fontSize: 13,
        color: "#4B5563",
        fontWeight: "400",
    },
    meta: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "400",
    },
    amount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    btnClose: { backgroundColor: "#FEF2F2" },
    btnReopen: { backgroundColor: "#F0FDF4" },
    btnEdit: { backgroundColor: Colors.primarySoft },
    actionText: {
        fontSize: 13,
        fontWeight: "600",
    },
    rejectionBox: {
        marginTop: 12,
        padding: 10,
        backgroundColor: "#FFF5F5",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    rejectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#DC2626",
        marginBottom: 2,
    },
    rejectionText: {
        fontSize: 13,
        color: "#B91C1C",
        lineHeight: 18,
    },
});
