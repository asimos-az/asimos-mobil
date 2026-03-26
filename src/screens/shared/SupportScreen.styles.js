import { StyleSheet, Platform } from "react-native";
import { Colors } from "../../theme/colors";

export const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.bg,
    },
    backBtn: { padding: 8, marginLeft: -8 },
    title: { fontSize: 20, fontWeight: "900", color: Colors.text },
    addBtn: { padding: 8, marginRight: -8 },

    content: { padding: 20, flex: 1 },
    listContent: { padding: 20 },

    emptyWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },

    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    subject: { fontWeight: "800", color: Colors.text, fontSize: 16, flex: 1, marginRight: 10 },
    snippet: { color: Colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    date: { color: Colors.muted, fontSize: 12, fontWeight: '500' },

    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
    badgeText: { fontSize: 11, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 },
    badgeOpenText: { color: Colors.primaryDark },
    badgeOpenBg: { backgroundColor: Colors.primarySoft },
    badgeRepliedText: { color: "#D97706" },
    badgeRepliedBg: { backgroundColor: "#FEF3C7" },
    badgeClosedText: { color: Colors.muted },
    badgeClosedBg: { backgroundColor: Colors.border },

    msgBox: {
        maxWidth: "85%",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        marginBottom: 12,
    },
    msgUser: {
        alignSelf: "flex-end",
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    msgAdmin: {
        alignSelf: "flex-start",
        backgroundColor: "#F1F5F9",
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextUser: { color: "#fff", fontWeight: '500' },
    msgTextAdmin: { color: Colors.text, fontWeight: '500' },
    msgDate: { marginTop: 6, fontSize: 10, alignSelf: "flex-end", fontWeight: '600' },
    msgDateUser: { color: "rgba(255,255,255,0.7)" },
    msgDateAdmin: { color: Colors.muted },

    ticketInfoBanner: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: Colors.bg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center'
    },
    ticketInfoTitle: { fontWeight: '800', color: Colors.text, fontSize: 16, marginBottom: 6, textAlign: 'center' },
    ticketInfoStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ticketInfoStatusText: { fontSize: 12, fontWeight: '700', color: Colors.muted },

    chatInputWrap: {
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === "ios" ? 16 : 12,
        borderTopWidth: 1,
        borderColor: Colors.border,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        backgroundColor: "#fff",
        paddingBottom: Platform.OS === 'ios' ? 30 : 12
    },
    inputField: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: {
        backgroundColor: Colors.border
    }
});
