import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeScreen } from "../../components/SafeScreen";
import { BackgroundDecor } from "../../components/BackgroundDecor";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Input } from "../../components/Input";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

/**
 * Qeydiyyat zamanı emailə OTP (kod) göndərilir.
 * User 6 rəqəmli kodu daxil edib təsdiqləyir.
 */
export function VerifyOtpScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const { verifyEmailOtp, resendEmailOtp } = useAuth();

  const email = route.params?.email || "";
  const password = route.params?.password || "";
  const roleHint = route.params?.role || null;
  const fullName = route.params?.fullName || "";
  const companyName = route.params?.companyName ?? null;
  const phone = route.params?.phone ?? null;
  const redirect = route.params?.redirect || null;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const toast = useToast();

  const hint = useMemo(() => {
    if (!email) return "";
    return `OTP kod ${email} ünvanına göndərildi. Adətən 6 rəqəmdir (bəzən 8 ola bilər). (Gəlmirsə Spam/Promotions yoxla)`;
  }, [email]);

  async function onVerify() {
    if (loading) return;
    if (!email || !password) {
      toast.show("Email və ya şifrə tapılmadı. Geri qayıdıb yenidən cəhd et.", "error");
      return;
    }
    const clean = String(code || "").replace(/\s+/g, "").trim();
    if (!/^\d{6,8}$/.test(clean)) {
      toast.show("OTP kod 6 (və ya 8) rəqəmli olmalıdır.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyEmailOtp({ email, code: clean, password, role: roleHint, fullName, companyName, phone });

      if (res?.pendingApproval) {
        toast.show(res.message || "Hesabınız təsdiq gözləyir.", "success");
        setTimeout(() => {
          if (nav.canGoBack()) nav.goBack();
        }, 1500);
        return;
      }

      if (nav.canGoBack()) nav.goBack();
      if (redirect?.screen) {
        requestAnimationFrame(() => {
          try { nav.navigate(redirect.screen, redirect.params || {}); } catch { }
        });
      }
    } catch (e) {
      toast.show(e.message || "OTP doğrulanmadı", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (resendLoading) return;
    if (!email) {
      toast.show("Email tapılmadı", "error");
      return;
    }
    setResendLoading(true);
    try {
      await resendEmailOtp({ email });
      toast.show("OTP kod yenidən göndərildi", "success");
    } catch (e) {
      toast.show(e.message || "Göndərmək mümkün olmadı", "error");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <SafeScreen>
      <View style={styles.screen}>
        <BackgroundDecor />

        <ScrollView
          contentContainerStyle={styles.center}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={false}
        >
          <Image source={require("../../../assets/logo.jpeg")} style={styles.logo} resizeMode="contain" />
          <Card>
            <Text style={styles.title}>OTP təsdiqi</Text>
            {!!hint && <Text style={styles.sub}>{hint}</Text>}

            <View style={{ height: 14 }} />
            <Input
              label="OTP kod"
              value={code}
              onChangeText={(t) => setCode(String(t || "").replace(/\D+/g, "").slice(0, 8))}
              placeholder="Məs: 123456"
              keyboardType="number-pad"
              maxLength={8}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              autoCorrect={false}
            />

            <View style={{ height: 10 }} />
            <PrimaryButton title="Təsdiqlə" loading={loading} onPress={onVerify} />

            <View style={{ height: 10 }} />
            <Pressable onPress={onResend} disabled={resendLoading}>
              <Text style={[styles.link, resendLoading && { opacity: 0.6 }]}>OTP kodu yenidən göndər</Text>
            </Pressable>

            <View style={{ height: 6 }} />
            <Pressable onPress={() => nav.goBack()}>
              <Text style={styles.back}>← Geri</Text>
            </Pressable>
          </Card>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  center: { flexGrow: 1, padding: 16, paddingBottom: 160, justifyContent: "center" },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 24,
    alignSelf: "center",
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 8, color: Colors.subtext, lineHeight: 18, fontWeight: "800" },
  link: { marginTop: 8, color: Colors.primary, fontWeight: "900", textAlign: "center" },
  back: { marginTop: 8, color: Colors.subtext, textAlign: "center", fontWeight: "800" },
});
