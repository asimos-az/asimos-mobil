import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Card } from "../../components/Card";


import { api } from "../../api/client";

export function EmployerNotificationsScreen() {
  const navigation = useNavigation();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const unreadCount = useMemo(() => (items || []).filter((n) => !n.read_at).length, [items]);

  const loadData = React.useCallback(async () => {
    try {
      const res = await api.listMyNotifications({ limit: 50 });
      setItems(res.items || []);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      const nowIso = new Date().toISOString();
      setItems((prev) => (prev || []).map((x) => ({ ...x, read_at: x.read_at || nowIso })));
    } catch {}
  }

  return (
    <SafeScreen>
      <View style={styles.top}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Bildirişlər</Text>
          <Text style={styles.sub}>{unreadCount ? `${unreadCount} oxunmamış` : "Hamısı oxunub"}</Text>
        </View>

        <Pressable
          onPress={markAllRead}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          ListEmptyComponent={
            !loading && <Text style={styles.empty}>Hələ bildiriş yoxdur.</Text>
          }
          renderItem={({ item }) => {
            const unread = !item.read_at;
            return (
            <Pressable onPress={() => {
              if (item.data?.type === "support") {
                navigation.navigate("Support");
              }
              if (unread) {
                api.markNotificationRead(item.id)
                  .then(() => {
                    setItems((prev) => (prev || []).map((x) => x.id === item.id ? { ...x, read_at: x.read_at || new Date().toISOString() } : x));
                  })
                  .catch(() => {});
              }
            }}>
              <Card style={[styles.itemCard, unread ? styles.itemCardUnread : null]}>
                <View style={styles.itemHead}>
                  <Text style={[styles.itemState, unread ? styles.itemStateUnread : styles.itemStateRead]}>
                    {unread ? "Yeni" : "Oxunub"}
                  </Text>
                  {unread ? <View style={styles.dot} /> : null}
                </View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBody}>{item.body}</Text>
                {item.created_at && (
                  <Text style={{ marginTop: 8, fontSize: 12, color: Colors.muted }}>
                    {new Date(item.created_at).toLocaleString("az-AZ")}
                  </Text>
                )}
              </Card>
            </Pressable>
          )}}
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
  itemCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemCardUnread: {
    borderColor: Colors.primary,
  },
  itemHead: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemState: {
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  itemStateUnread: {
    color: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  itemStateRead: {
    color: Colors.muted,
    backgroundColor: "#EEF2F7",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  itemTitle: { fontWeight: "900", color: Colors.text },
  itemBody: { marginTop: 6, color: Colors.muted, fontWeight: "700" },
});
