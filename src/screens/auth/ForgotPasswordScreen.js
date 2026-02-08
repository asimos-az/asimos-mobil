import React, { useState } from "react";
import { Alert, StyleSheet, Text, View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SafeScreen } from "../../components/SafeScreen";
import { BackgroundDecor } from "../../components/BackgroundDecor";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Colors } from "../../theme/colors";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export function ForgotPasswordScreen() {
    const nav = useNavigation();
    const { resetPassword } = useAuth(); // Use context wrapper for session handling

    const [step, setStep] = useState(1); // 1: Email, 2: Reset
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");

    async function handleSendOtp() {
        if (!email) {
            Alert.alert("Xəta", "Email daxil edin.");
            return;
        }
        setLoading(true);
        try {
            await api.forgotPassword(email);
            setStep(2);
            Alert.alert("Uğurlu", "Təsdiq kodu emailinizə göndərildi.");
        } catch (e) {
            Alert.alert("Xəta", e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleReset() {
        if (!code || !password) {
            Alert.alert("Xəta", "Kod və yeni şifrəni daxil edin.");
            return;
        }
        setLoading(true);
        try {

            await resetPassword({ email, code, password });

            Alert.alert("Uğurlu", "Şifrəniz yeniləndi və hesabınıza daxil oldunuz.", [
                { text: "Davam et", onPress: () => nav.navigate("SeekerTabs") }
            ]);
        } catch (e) {
            Alert.alert("Xəta", e.message);
        } finally {
            setLoading(false);
        }
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
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </Pressable>
                        <Text style={styles.title}>Şifrə Bərpası</Text>
                        <Text style={styles.subtitle}>
                            {step === 1
                                ? "Email ünvanınızı daxil edin, sizə təsdiq kodu göndərək."
                                : "Emailinizə gələn 6 rəqəmli kodu və yeni şifrənizi daxil edin."}
                        </Text>
                    </View>

                    <View style={styles.card}>
                        {step === 1 ? (
                            <>
                                <Input
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="mail@example.com"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <View style={{ height: 24 }} />
                                <PrimaryButton
                                    title="Kod göndər"
                                    onPress={handleSendOtp}
                                    loading={loading}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label="Təsdiq kodu"
                                    value={code}
                                    onChangeText={setCode}
                                    placeholder="123456"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                                <Input
                                    label="Yeni şifrə"
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    secureTextEntry
                                />
                                <View style={{ height: 24 }} />
                                <PrimaryButton
                                    title="Şifrəni yenilə"
                                    onPress={handleReset}
                                    loading={loading}
                                />
                                <Pressable onPress={() => setStep(1)} style={styles.linkBtn} disabled={loading}>
                                    <Text style={styles.linkText}>Email səhvdir?</Text>
                                </Pressable>
                            </>
                        )}
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    scroll: { flexGrow: 1, padding: 20 },
    header: { marginBottom: 30, alignItems: "center" },
    backBtn: { position: "absolute", left: 0, top: 0, padding: 8, marginLeft: -8, zIndex: 1 },
    title: { fontSize: 24, fontWeight: "900", color: Colors.text, marginBottom: 8, marginTop: 40 },
    subtitle: { fontSize: 15, color: Colors.muted, textAlign: "center", lineHeight: 22, maxWidth: "85%" },

    card: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },

    linkBtn: { alignSelf: "center", marginTop: 20, padding: 10 },
    linkText: { color: Colors.primary, fontWeight: "700" },
});
