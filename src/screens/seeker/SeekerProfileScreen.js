import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Card } from "../../components/Card";
import { Colors } from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import { PrimaryButton } from "../../components/PrimaryButton";

export function SeekerProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.body}>
        <Card>
          <Text style={styles.name}>{user?.fullName || "—"}</Text>
          <Text style={styles.item}>Email: {user?.email || "—"}</Text>
          <Text style={styles.item}>Telefon: {user?.phone || "—"}</Text>

          <View style={{ height: 14 }} />
          <PrimaryButton variant="secondary" title="Çıxış" onPress={signOut} />
        </Card>
      </View>
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
  body: { flex: 1, padding: 16 },
  name: { fontSize: 18, fontWeight: "900", color: Colors.text, marginBottom: 10 },
  item: { color: Colors.muted, fontWeight: "800", marginBottom: 6 },
});
