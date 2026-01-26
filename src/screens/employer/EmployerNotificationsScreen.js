import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";

// Simple notifications screen.
// NOTE: backend-də bildiriş tarixçəsi saxlanılmırsa, bu ekran boş görünəcək.
// İstəsən, gələcəkdə Supabase-də `notifications` cədvəli əlavə edib buradan API ilə yükləyə bilərik.

export function EmployerNotificationsScreen() {
  const navigation = useNavigation();

  const items = useMemo(() => {
    // Placeholder. (No backend history yet.)
    return [];
  }, []);

  function goMap() {
    // EmployerMap artıq tab içindədir.
    // Stack-də olduğumuz üçün tab-a keçid edirik.
    navigation.navigate("EmployerMap");
  }

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bildirişlər</Text>
          <Text style={styles.sub}>Sənin üçün yeniliklər</Text>
        </View>

        <Pressable
          onPress={goMap}
          style={styles.iconBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Xəritə"
        >
          <Ionicons name="map-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Hələ bildiriş yoxdur.</Text>
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody}>{item.body}</Text>
            </Card>
          )}
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "900", color: Colors.text },
  sub: { marginTop: 3, color: Colors.muted, fontWeight: "800" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  body: { flex: 1, padding: 16 },
  empty: { color: Colors.muted, textAlign: "center", marginTop: 22, fontWeight: "800" },
  itemTitle: { fontWeight: "900", color: Colors.text },
  itemBody: { marginTop: 6, color: Colors.muted, fontWeight: "700" },
});
