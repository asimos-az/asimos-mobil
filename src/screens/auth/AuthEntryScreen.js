import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { MapPicker } from "../../components/MapPicker";

const MODE = { LOGIN: "login", REGISTER: "register" };
const ROLE = { ALICI: "seeker", SATICI: "employer" };

export function AuthEntryScreen() {
  const { signIn, register } = useAuth();

  const [mode, setMode] = useState(MODE.LOGIN);
  const [role, setRole] = useState(ROLE.ALICI);
  const [loading, setLoading] = useState(false);

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const roleOptions = useMemo(() => ([
    { label: "Alıcı", value: ROLE.ALICI },
    { label: "Satıcı", value: ROLE.SATICI },
  ]), []);

  async function onSubmit() {
    try {
      setLoading(true);
      if (mode === MODE.LOGIN) {
        await signIn({ email, password });
        return;
      }

      if (!fullName || !email || !password || !phone) {
        Alert.alert("Xəta", "Zəhmət olmasa bütün xanaları doldur.");
        return;
      }
      if (role === ROLE.SATICI && (!companyName || !location)) {
        Alert.alert("Xəta", "Satıcı qeydiyyatı üçün şirkət adı və lokasiya vacibdir.");
        return;
      }

      await register({
        role,
        fullName,
        companyName: role === ROLE.SATICI ? companyName : undefined,
        email,
        password,
        phone,
        location: role === ROLE.SATICI ? location : undefined,
      });
    } catch (e) {
      Alert.alert("Xəta", e.message || "Bir xəta oldu");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(which) {
    if (which === ROLE.ALICI) {
      setRole(ROLE.ALICI);
      setEmail("seeker@test.com");
      setPassword("Password123!");
    } else {
      setRole(ROLE.SATICI);
      setEmail("employer@test.com");
      setPassword("Password123!");
    }
    setMode(MODE.LOGIN);
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={location}
        onClose={() => setMapOpen(false)}
        onPicked={(loc) => setLocation(loc)}
      />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Asimos</Text>
          <Text style={styles.subtitle}>İş axtaran və işçi axtaran platforması</Text>
        </View>

        <Card>
          <SegmentedControl
            options={[
              { label: "Login", value: MODE.LOGIN },
              { label: "Qeydiyyat", value: MODE.REGISTER },
            ]}
            value={mode}
            onChange={setMode}
            style={{ marginBottom: 12 }}
          />

          <Text style={styles.sectionTitle}>Tip seç</Text>
          <SegmentedControl options={roleOptions} value={role} onChange={setRole} style={{ marginBottom: 14 }} />

          {mode === MODE.REGISTER ? (
            <>
              <Input label="Ad Soyad" value={fullName} onChangeText={setFullName} placeholder="Məs: Xəyyam Məmmədli" autoCapitalize="words" />
              {role === ROLE.SATICI ? (
                <Input label="Şirkət adı" value={companyName} onChangeText={setCompanyName} placeholder="Məs: Asimos LLC" autoCapitalize="words" />
              ) : null}

              <Input label="Email" value={email} onChangeText={setEmail} placeholder="example@mail.com" keyboardType="email-address" />
              <Input label="Şifrə" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
              <Input label="Mobil nömrə" value={phone} onChangeText={setPhone} placeholder="+994..." keyboardType="phone-pad" />

              {role === ROLE.SATICI ? (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>Lokasiya</Text>
                  <Pressable onPress={() => setMapOpen(true)} style={styles.locationBtn}>
                    <Text style={styles.locationBtnText}>
                      {location?.address ? location.address : "Xəritədən seç"}
                    </Text>
                  </Pressable>
                  <Text style={styles.help}>Xəritədə axtarış edə, toxunub seçə bilərsən.</Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="example@mail.com" keyboardType="email-address" />
              <Input label="Şifrə" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

              <View style={styles.demoRow}>
                <Text style={styles.demoText}>Test giriş:</Text>
                <Pressable onPress={() => fillDemo(ROLE.ALICI)} style={styles.demoChip}>
                  <Text style={styles.demoChipText}>Alıcı</Text>
                </Pressable>
                <Pressable onPress={() => fillDemo(ROLE.SATICI)} style={styles.demoChip}>
                  <Text style={styles.demoChipText}>Satıcı</Text>
                </Pressable>
              </View>
            </>
          )}

          <PrimaryButton
            title={mode === MODE.LOGIN ? "Daxil ol" : "Qeydiyyatdan keç"}
            onPress={onSubmit}
            loading={loading}
          />

          <View style={{ height: 10 }} />

          <PrimaryButton
            variant="secondary"
            title={mode === MODE.LOGIN ? "Hesabın yoxdur? Qeydiyyat" : "Artıq hesabın var? Login"}
            onPress={() => setMode(mode === MODE.LOGIN ? MODE.REGISTER : MODE.LOGIN)}
          />
        </Card>

        <Text style={styles.footerNote}>Satıcı qeydiyyatı üçün lokasiya mütləqdir. (Mock data)</Text>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  header: { marginTop: 10, marginBottom: 14 },
  brand: { fontSize: 30, fontWeight: "900", color: Colors.text, letterSpacing: 0.2 },
  subtitle: { color: Colors.muted, marginTop: 6, fontWeight: "700" },

  sectionTitle: { fontWeight: "900", color: Colors.text, marginBottom: 8 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "700" },

  locationBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  locationBtnText: { color: Colors.text, fontWeight: "800" },
  help: { marginTop: 6, color: Colors.muted, fontSize: 12, fontWeight: "700" },

  demoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  demoText: { color: Colors.muted, fontWeight: "800" },
  demoChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: Colors.primarySoft },
  demoChipText: { color: Colors.primary, fontWeight: "900" },

  footerNote: { textAlign: "center", marginTop: 14, color: Colors.muted, fontSize: 12, fontWeight: "700" },
});
