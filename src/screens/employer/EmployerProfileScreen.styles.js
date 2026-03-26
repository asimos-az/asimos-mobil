import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 0 },

  guestWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  guestIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: "center", justifyContent: "center", marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: "800", color: '#0F172A', marginBottom: 8 },
  guestSub: { fontSize: 14, color: '#64748B', textAlign: "center", marginBottom: 24, lineHeight: 20 },

  profileHeader: { alignItems: 'center', marginTop: 0, marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#475569' },
  userName: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  userEmail: { fontSize: 15, fontWeight: '500', color: '#64748B', marginTop: 4 },
  userCompany: { fontSize: 13, fontWeight: '700', color: '#2563EB', marginTop: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, marginBottom: 32, paddingHorizontal: 10 },
  statLine: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', marginBottom: 8, marginLeft: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  listItemText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#334155', marginLeft: 14 },
  listValueText: { fontSize: 15, fontWeight: '500', color: '#64748B' },
  listActionBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  listActionText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 50 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 320, backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: '#0F172A', marginBottom: 16, textAlign: "center" },
  soundItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  soundItemActive: { backgroundColor: '#F8FAFC', marginHorizontal: -20, paddingHorizontal: 20 },
  soundText: { fontSize: 16, fontWeight: "600", color: '#334155' },
  soundTextActive: { color: '#000', fontWeight: "800" },
  modalClose: { marginTop: 16, alignItems: "center", paddingVertical: 14, backgroundColor: '#F1F5F9', borderRadius: 12 },
  modalCloseText: { fontWeight: "800", color: '#0F172A' },

  flexRowRight: { flexDirection: 'row', alignItems: 'center' },
  listItemDangerText: { color: '#DC2626' },
  flex1: { flex: 1 },
  scrollFlex: { flex: 1 },
  spacer40: { height: 40 }
});
