import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { SelectField } from "../../components/SelectField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";

export function SeekerCreateAdScreen({ navigation }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [wage, setWage] = useState("");
    const [category, setCategory] = useState("");
    const [whatsapp, setWhatsapp] = useState(user?.phone || "+994");
    const [phone, setPhone] = useState(user?.phone || "+994");
    const [description, setDescription] = useState("");

    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState([]);

    useEffect(() => {
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
                if (alive) {
                    setCategoryOptions(out);
                }
            } catch (e) {
            } finally {
                if (alive) setCategoriesLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const [location, setLocation] = useState(user.location || null);
    const [mapOpen, setMapOpen] = useState(false);

    useEffect(() => {
        import("../../utils/deviceLocation").then(({ getDeviceLocationOrNull }) => {
            getDeviceLocationOrNull().then(loc => {
                if (loc) setLocation(loc);
            });
        });
    }, []);

    const toast = useToast();

    async function submit() {
        try {
            setLoading(true);

            if (!title || !description) {
                toast.show("Başlıq və təsvir vacibdir.", "error");
                return;
            }
            if (!location) {
                toast.show("Lokasiya seçin.", "error");
                return;
            }

            await api.createJob({
                title,
                wage,
                category,
                whatsapp,
                phone,
                description,
                jobType: "seeker", // Explicitly seeker
                notifyRadiusM: 0, // No notification blast for seeker ads
                createdBy: user.id,
                location,
            });

            Alert.alert("Uğurlu", "Elanınız yerləşdirildi.");
            navigation.goBack();
        } catch (e) {
            toast.show(e.message, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeScreen>
            <MapPicker
                visible={mapOpen}
                initial={location}
                userLocation={user?.location || null}
                onClose={() => setMapOpen(false)}
                onPicked={(loc) => setLocation(loc)}
            />

            <View style={styles.top}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <Ionicons name="chevron-back" size={26} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>İş elanı yerləşdir</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Card>
                    <Input
                        label="Başlıq (Nə iş axtarırsınız?)"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Məs: Ofisiant işi axtarıram"
                        autoCapitalize="sentences"
                    />

                    <View style={{ height: 10 }} />

                    <SelectField
                        label="Kateqoriya"
                        value={category}
                        onChange={(v) => {
                            const raw = String(v || "");
                            setCategory(raw.startsWith("↳ ") ? raw.slice(2) : raw);
                        }}
                        placeholder="Kateqoriya seç"
                        options={categoryOptions}
                        loading={categoriesLoading}
                    />

                    <Input
                        label="Arzu olunan maaş"
                        value={wage}
                        onChangeText={setWage}
                        placeholder="Məs: 800 AZN"
                    />

                    <Input
                        label="WhatsApp nömrəsi"
                        value={whatsapp}
                        onChangeText={setWhatsapp}
                        placeholder="+994..."
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Əlaqə nömrəsi"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+994..."
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Haqqınızda / Təcrübə"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Təcrübəniz və bacarıqlarınız barədə ətraflı yazın..."
                        multiline
                        numberOfLines={6}
                    />

                    <View style={{ height: 10 }} />

                    <Text style={styles.label}>Lokasiya</Text>
                    <PrimaryButton
                        variant="secondary"
                        title={location?.address ? location.address : "Xəritədən seç"}
                        onPress={() => setMapOpen(true)}
                    />

                    <View style={{ height: 14 }} />
                    <PrimaryButton title="Yerləşdir" loading={loading} onPress={submit} />
                </Card>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    top: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 14,
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    title: { fontSize: 18, fontWeight: "900", color: Colors.text, flex: 1, textAlign: "center" },
    scroll: { padding: 16, paddingBottom: 160 },
    label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
});
