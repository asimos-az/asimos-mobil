import React, { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { BackgroundDecor } from "../../components/BackgroundDecor";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../api/client";

const MODE = { LOGIN: "login", REGISTER: "register" };
const ROLE = { ALICI: "seeker", SATICI: "employer" };
const ROLE_HINT_KEY = "ASIMOS_ROLE_HINT_V1";

export function AuthEntryScreen() {
  const { signIn, startRegister } = useAuth();
  const nav = useNavigation();
  const route = useRoute();
  const redirect = route?.params?.redirect;

  const [mode, setMode] = useState(MODE.LOGIN);
  const [role, setRole] = useState(ROLE.ALICI);

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const modeOptions = useMemo(() => ([
    { label: "Daxil ol", value: MODE.LOGIN },
    { label: "Qeydiyyat", value: MODE.REGISTER },
  ]), []);

  const roleOptions = useMemo(() => ([
    { label: "İş axtaran", value: ROLE.ALICI },
    { label: "İşçi axtaran", value: ROLE.SATICI },
  ]), []);

  async function submit() {
    if (loading) return;

    setLoading(true);
    try {
      // UI-də seçilən rolu yadda saxla (backend role qaytarmasa da düzgün panelə düşmək üçün)
      await AsyncStorage.setItem(ROLE_HINT_KEY, role).catch(() => {});

      if (mode === MODE.LOGIN) {
        if (!email || !password) {
          Alert.alert("Xəta", "Email və şifrə daxil edin.");
          return;
        }
        await signIn({ email, password, roleHint: role });
        // Close modal and return to the previous screen (e.g., JobDetail)
        if (nav.canGoBack()) nav.goBack();
        if (redirect?.screen) {
          requestAnimationFrame(() => {
            try { nav.navigate(redirect.screen, redirect.params || {}); } catch {}
          });
        }
        return;
      }

      // REGISTER
      if (!fullName || !email || !password || !phone) {
        Alert.alert("Xəta", "Zəhmət olmasa bütün xanaları doldur.");
        return;
      }
      if (role === ROLE.SATICI && !companyName) {
        Alert.alert("Xəta", "İşçi axtaran qeydiyyatı üçün şirkət adı vacibdir.");
        return;
      }

      const res = await startRegister({
        role,
        fullName,
        companyName: role === ROLE.SATICI ? companyName : undefined,
        email,
        password,
        phone,
      });

      if (res?.needsOtp) {
        // OTP kod emailə göndərilir və user kodu daxil edib qeydiyyatı tamamlayır.
        nav.navigate("VerifyOtp", {
          email,
          password,
          role,
          fullName,
          companyName: role === ROLE.SATICI ? companyName : undefined,
          phone,
          redirect,
        });
        return;
      }

      if (res?.token && res?.refreshToken && res?.user) {
        await signIn({ email, password, roleHint: role });
        if (nav.canGoBack()) nav.goBack();
        if (redirect?.screen) {
          requestAnimationFrame(() => {
            try { nav.navigate(redirect.screen, redirect.params || {}); } catch {}
          });
        }
      }
    } catch (e) {
      const apiInfo = typeof __DEV__ !== "undefined" && __DEV__ ? `

API: ${API_BASE_URL}` : "";
      Alert.alert("Xəta", (e?.message || "Bir xəta oldu") + apiInfo);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <View style={styles.screen}>
        <BackgroundDecor />
        {/* Logo is used as brand mark instead of a handwritten watermark */}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="always"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.center}>
          <Image
            source={require("../../../assets/logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Asimos logo"
          />

          <Card style={styles.card}>
          <SegmentedControl
            options={modeOptions}
            value={mode}
            onChange={setMode}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.sectionTitle}>Tip seç</Text>
          <SegmentedControl
            options={roleOptions}
            value={role}
            onChange={setRole}
            style={{ marginBottom: 14 }}
          />

          {mode === MODE.REGISTER ? (
            <>
              <Input
                label="Ad Soyad"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Məs: Xəyyam Məmmədli"
                autoCapitalize="words"
              />

              {role === ROLE.SATICI ? (
                <Input
                  label="Şirkət adı"
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Məs: Asimos LLC"
                  autoCapitalize="words"
                />
              ) : null}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="mail@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Input
                label="Şifrə"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <Input
                label="Mobil nömrə"
                value={phone}
                onChangeText={setPhone}
                placeholder="+994..."
                keyboardType="phone-pad"
              />

              <Text style={styles.help}>
                Qeydiyyatdan sonra lokasiya telefon permission-u ilə avtomatik alınacaq.
              </Text>
            </>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="mail@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Input
                label="Şifrə"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </>
          )}

          <View style={{ height: 14 }} />
          <PrimaryButton title={mode === MODE.LOGIN ? "Daxil ol" : "Qeydiyyat"} loading={loading} onPress={submit} />
          </Card>
        </View>
      </ScrollView>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // Extra bottom padding so inputs never hide behind keyboard / home indicator
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 160 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  logo: { width: 120, height: 120, marginBottom: 8 },

  card: { marginTop: 14, width: "100%", maxWidth: 440 },

  sectionTitle: { color: Colors.muted, fontWeight: "900", marginBottom: 8 },
  help: { marginTop: 10, color: Colors.muted, fontWeight: "700", fontSize: 12, lineHeight: 16 },
});
