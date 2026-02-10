import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert, Image, ScrollView, StyleSheet, Text, View, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { BackgroundDecor } from "../../components/BackgroundDecor";
import { Input } from "../../components/Input";
import { SelectField } from "../../components/SelectField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, api } from "../../api/client";
import { Ionicons } from "@expo/vector-icons";

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
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("+994");
  const [termsAccepted, setTermsAccepted] = useState(false);

  React.useEffect(() => {
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
        console.error("Category fetch error:", e);
      } finally {
        if (alive) setCategoriesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function submit() {
    if (loading) return;

    setLoading(true);
    try {
      await AsyncStorage.setItem(ROLE_HINT_KEY, role).catch(() => { });

      if (mode === MODE.LOGIN) {
        if (!email || !password) {
          Alert.alert("Xəta", "Email və şifrə daxil edin.");
          return;
        }
        await signIn({ email, password, roleHint: role });

        if (nav.canGoBack()) nav.goBack();
        if (redirect?.screen) {
          requestAnimationFrame(() => {
            try { nav.navigate(redirect.screen, redirect.params || {}); } catch { }
          });
        }
        return;
      }

      if (!fullName || !email || !password || !confirmPassword || !phone) {
        Alert.alert("Xəta", "Zəhmət olmasa bütün xanaları doldur.");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Xəta", "Şifrələr eyni deyil.");
        return;
      }
      if (role === ROLE.SATICI && !companyName) {
        Alert.alert("Xəta", "İşçi axtaran qeydiyyatı üçün şirkət adı vacibdir.");
        return;
      }
      if (role === ROLE.SATICI && !category) {
        Alert.alert("Xəta", "İşçi axtaran qeydiyyatı üçün kateqoriya seçilməlidir.");
        return;
      }

      const res = await startRegister({
        role,
        fullName,
        companyName: role === ROLE.SATICI ? companyName : undefined,
        category: role === ROLE.SATICI ? category : undefined,
        email,
        password,
        phone,
      });

      if (res?.needsOtp) {
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
            try { nav.navigate(redirect.screen, redirect.params || {}); } catch { }
          });
        }
      }
    } catch (e) {
      const apiInfo = typeof __DEV__ !== "undefined" && __DEV__ ? `\n\nAPI: ${API_BASE_URL}` : "";
      Alert.alert("Xəta", (e?.message || "Bir xəta oldu") + apiInfo);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === MODE.LOGIN ? MODE.REGISTER : MODE.LOGIN);
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.screen}
      >
        <BackgroundDecor />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={{ width: "100%", alignItems: "flex-start", marginBottom: 10 }}>
              {nav.canGoBack() ? (
                <Pressable onPress={() => nav.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                  <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
              ) : (
                <Pressable onPress={() => {
                  nav.navigate("SeekerTabs"); // Try navigating to main tabs
                }} style={{ padding: 8, marginLeft: -8 }}>
                  <Text style={{ color: Colors.muted, fontWeight: "700" }}>Hələlik keç</Text>
                </Pressable>
              )}
            </View>

            <Image
              source={require("../../../assets/logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Asimos logo"
            />
            <Text style={styles.title}>
              {mode === MODE.LOGIN ? "Xoş gəldiniz!" : "Qeydiyyat"}
            </Text>
            <Text style={styles.subtitle}>
              {mode === MODE.LOGIN
                ? "Davam etmək üçün hesabınıza daxil olun."
                : "Yeni hesab yaradaraq imkanlardan yararlanın."}
            </Text>
          </View>

          <View style={styles.formCard}>

            {mode === MODE.REGISTER && (
              <View style={styles.roleContainer}>
                <Pressable
                  style={[styles.roleBtn, role === ROLE.ALICI && styles.roleBtnActive]}
                  onPress={() => setRole(ROLE.ALICI)}
                >
                  <Ionicons name="person" size={20} color={role === ROLE.ALICI ? Colors.primary : Colors.muted} />
                  <Text style={[styles.roleText, role === ROLE.ALICI && styles.roleTextActive]}>İş axtaran</Text>
                </Pressable>

                <Pressable
                  style={[styles.roleBtn, role === ROLE.SATICI && styles.roleBtnActive]}
                  onPress={() => setRole(ROLE.SATICI)}
                >
                  <Ionicons name="briefcase" size={20} color={role === ROLE.SATICI ? Colors.primary : Colors.muted} />
                  <Text style={[styles.roleText, role === ROLE.SATICI && styles.roleTextActive]}>İşçi axtaran</Text>
                </Pressable>
              </View>
            )}

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
                  <>
                    <Input
                      label="Şirkət adı"
                      value={companyName}
                      onChangeText={setCompanyName}
                      placeholder="Məs: Asimos LLC"
                      autoCapitalize="words"
                    />

                    <SelectField
                      label="Fəaliyyət sahəsi (Kateqoriya)"
                      value={category}
                      onChange={(v) => {
                        const raw = String(v || "");
                        setCategory(raw.startsWith("↳ ") ? raw.slice(2) : raw);
                      }}
                      placeholder="Kateqoriya seç"
                      options={categoryOptions}
                      loading={categoriesLoading}
                    />
                    <View style={{ height: 16 }} />
                  </>
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
                  label="Şifrənin təkrarı"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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

                <Pressable
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 }}
                >
                  <Ionicons
                    name={termsAccepted ? "checkbox" : "square-outline"}
                    size={24}
                    color={termsAccepted ? Colors.primary : Colors.muted}
                  />
                  <Text style={{ flex: 1, color: Colors.muted, fontSize: 13, lineHeight: 18 }}>
                    <Text style={{ fontWeight: "700", color: Colors.text }}>Qaydalar və Şərtlər</Text> ilə tanış oldum və razıyam.
                  </Text>
                </Pressable>
                <Pressable onPress={() => nav.navigate("Terms", { slug: "terms", title: "Qaydalar" })} style={{ marginLeft: 34, marginTop: 4 }}>
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' }}>Qaydaları oxu</Text>
                </Pressable>
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
                <Pressable style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={() => nav.navigate("ForgotPassword")}>
                  <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Şifrəni unutmusan?</Text>
                </Pressable>
              </>
            )}

            <View style={{ height: 24 }} />
            <PrimaryButton
              title={mode === MODE.LOGIN ? "Daxil ol" : "Qeydiyyat"}
              loading={loading}
              disabled={mode === MODE.REGISTER && !termsAccepted}
              onPress={submit}
            />

          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {mode === MODE.LOGIN ? "Hesabınız yoxdur?" : "Artıq hesabınız var?"}
            </Text>
            <Pressable onPress={toggleMode}>
              <Text style={styles.footerLink}>
                {mode === MODE.LOGIN ? "Qeydiyyatdan keçin" : "Daxil olun"}
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen >
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logo: { width: 100, height: 100, marginBottom: 16, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: "900", color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.muted, textAlign: "center", maxWidth: "80%" },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
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

  help: { marginTop: 12, color: Colors.muted, fontWeight: "600", fontSize: 12, lineHeight: 18, textAlign: 'center' },

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
  link: { color: Colors.primary, fontWeight: "800", textDecorationLine: "underline" },
});
