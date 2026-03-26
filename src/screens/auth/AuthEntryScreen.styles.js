import { StyleSheet } from "react-native";
import { Colors } from "../../theme/colors";

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  headerTop: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  backPressable: {
    padding: 8,
    marginLeft: -8,
  },
  skipText: {
    color: Colors.muted,
    fontWeight: "700",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.primary,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "900", color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.muted, textAlign: "center", maxWidth: "80%" },

  formCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleBtnActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  roleText: { fontWeight: "700", color: Colors.muted },
  roleTextActive: { color: Colors.primary, fontWeight: "900" },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  termsTextContainer: {
    flex: 1,
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  termsTextBold: {
    fontWeight: "700",
    color: Colors.text,
  },
  readTermsPressable: {
    marginLeft: 34,
    marginTop: 4,
  },
  readTermsText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  forgotPasswordPressable: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  spacing16: { height: 16 },
  spacing24: { height: 24 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: { color: Colors.text, fontWeight: "600", fontSize: 15 },
  footerLink: { color: Colors.primary, fontWeight: "900", fontSize: 15 },
});
