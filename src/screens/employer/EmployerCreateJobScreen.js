import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { MapPicker } from "../../components/MapPicker";

export function EmployerCreateJobScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [wage, setWage] = useState("");
  const [category, setCategory] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [isDaily, setIsDaily] = useState(false);

  const [location, setLocation] = useState(user.location || null);
  const [notifyRadiusM, setNotifyRadiusM] = useState("1200");
  const [mapOpen, setMapOpen] = useState(false);

  async function submit() {
    try {
      setLoading(true);
      if (!title || !description) {
        Alert.alert("Xəta", "Elanın adı və təsvir vacibdir.");
        return;
      }
      if (!location) {
        Alert.alert("Xəta", "Lokasiya seç.");
        return;
      }

      await api.createJob({
        title,
        wage,
        category,
        whatsapp,
        description,
        isDaily,
        notifyRadiusM: notifyRadiusM ? Number(notifyRadiusM) : null,
        createdBy: user.id,
        location,
      });

      Alert.alert("OK", "Elan yaradıldı.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Xəta", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeScreen>
      <MapPicker
        visible={mapOpen}
        initial={location}
        onClose={() => setMapOpen(false)}
        onPicked={(loc) => setLocation(loc)}
      />

      <View style={styles.top}>
        <Text style={styles.title}>Elan yarat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card>
          <Input label="Elanın adı" value={title} onChangeText={setTitle} placeholder="Məs: Ofisiant" autoCapitalize="words" />
          <Input label="Maaş" value={wage} onChangeText={setWage} placeholder="Məs: 800 AZN" />
          <Input label="Kateqoriya" value={category} onChangeText={setCategory} placeholder="Məs: Restoran" autoCapitalize="words" />
          <Input label="WhatsApp nömrəsi" value={whatsapp} onChangeText={setWhatsapp} placeholder="+994..." keyboardType="phone-pad" />
          <Input label="Təsvir" value={description} onChangeText={setDescription} placeholder="Detalları yaz..." multiline numberOfLines={6} autoCapitalize="sentences" />

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Gündəlik iş?</Text>
            <Switch value={isDaily} onValueChange={setIsDaily} />
          </View>
          <Text style={styles.help}>Gündəlik iş seçsən, “Gündəlik işlər” bölməsində ayrıca görünəcək.</Text>

          <View style={{ height: 10 }} />

          <Text style={styles.label}>Lokasiya</Text>
          <PrimaryButton
            variant="secondary"
            title={location?.address ? location.address : "Xəritədən seç"}
            onPress={() => setMapOpen(true)}
          />
          <Text style={styles.help}>Xəritədə axtarış edib lokasiyanı seç.</Text>

          <View style={{ height: 10 }} />

          <Input
            label="Bildiriş radiusu (metr)"
            value={notifyRadiusM}
            onChangeText={setNotifyRadiusM}
            placeholder="Məs: 1200"
            keyboardType="numeric"
          />
          <Text style={styles.help}>
            Bu radius gələcəkdə lokasiyası uyğun olan istifadəçilərə bildiriş göndərmək üçün saxlanılır (mock).
          </Text>

          <View style={{ height: 14 }} />
          <PrimaryButton title="Yarat" loading={loading} onPress={submit} />
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  scroll: { padding: 16, paddingBottom: 24 },
  label: { color: Colors.muted, marginBottom: 6, fontWeight: "900" },
  help: { marginTop: 6, color: Colors.muted, fontSize: 12, fontWeight: "700" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
});
