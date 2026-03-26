import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Alert, ScrollView, Text, View, Pressable, KeyboardAvoidingView, Platform } from "react-native";
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
import { styles } from "./AuthEntryScreen.styles";

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
            <View style={styles.headerTop}>
              {nav.canGoBack() ? (
                <Pressable onPress={() => nav.goBack()} style={styles.backPressable}>
                  <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
              ) : (
                <Pressable onPress={() => {
                  nav.navigate("SeekerTabs"); 
                }} style={styles.backPressable}>
                  <Text style={styles.skipText}>Hələlik keç</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.brandTitle}>Asimos</Text>
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
                    <View style={styles.spacing16} />
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
                  style={styles.termsRow}
                >
                  <Ionicons
                    name={termsAccepted ? "checkbox" : "square-outline"}
                    size={24}
                    color={termsAccepted ? Colors.primary : Colors.muted}
                  />
                  <Text style={styles.termsTextContainer}>
                    <Text style={styles.termsTextBold}>Qaydalar və Şərtlər</Text> ilə tanış oldum və razıyam.
                  </Text>
                </Pressable>
                <Pressable onPress={() => nav.navigate("Terms", { slug: "terms", title: "Qaydalar" })} style={styles.readTermsPressable}>
                  <Text style={styles.readTermsText}>Qaydaları oxu</Text>
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
                <Pressable style={styles.forgotPasswordPressable} onPress={() => nav.navigate("ForgotPassword")}>
                  <Text style={styles.forgotPasswordText}>Şifrəni unutmusan?</Text>
                </Pressable>
              </>
            )}

            <View style={styles.spacing24} />
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
    </SafeScreen>
  );
}
