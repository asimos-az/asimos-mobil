import React, { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../api/client";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Card } from "../../components/Card";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/SelectField";

const CATEGORIES = [
    "Elan yükləyə bilmirəm",
    "Hesab ilə bağlı problem",
    "Ödəniş problemi",
    "Digər"
];

export function SupportScreen() {
    const navigation = useNavigation();
    const toast = useToast();
    const [mode, setMode] = useState("list"); // list, create, detail
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create state
    const [cat, setCat] = useState("");
    const [msg, setMsg] = useState("");
    const [creating, setCreating] = useState(false);

    // Detail state
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        loadTickets();
    }, []);

    async function loadTickets() {
        try {
            setLoading(true);
            const res = await api.listTickets();
            if (res?.items) setTickets(res.items);
        } catch (e) {
            // ignore
        } finally {
            setLoading(false);
        }
    }

    async function sendTicket() {
        if (!cat && !msg) return;
        if (!msg) {
            toast.show("Mesaj yazın", "error");
            return;
        }
        try {
            setCreating(true);
            await api.createTicket({ category: cat, message: msg });
            toast.show("Müraciətiniz göndərildi", "success");
            setMode("list");
            setMsg("");
            setCat("");
            loadTickets();
        } catch (e) {
            toast.show(e.message, "error");
        } finally {
            setCreating(false);
        }
    }

    async function sendReply() {
        if (!replyMsg) return;
        try {
            setReplying(true);
            await api.replyTicket(activeTicket.id, replyMsg);
            toast.show("Cavab göndərildi", "success");
            setReplyMsg("");

            // Update local state optimistic
            const newMsg = {
                id: Math.random(),
                message: replyMsg,
                created_at: new Date().toISOString(),
                sender_id: "me", // simplified
                is_admin: false
            };

            const updated = { ...activeTicket };
            if (!updated.support_messages) updated.support_messages = [];
            updated.support_messages.push(newMsg);
            setActiveTicket(updated);

            loadTickets(); // fresh sync
        } catch (e) {
            toast.show(e.message, "error");
        } finally {
            setReplying(false);
        }
    }

    function renderItem({ item }) {
        const isClosed = item.status === "closed";
        const isReplied = item.status === "replied";

        return (
            <Pressable
                style={styles.card}
                onPress={() => {
                    setActiveTicket(item);
                    setMode("detail");
                }}
            >
                <View style={styles.row}>
                    <Text style={styles.subject}>{item.subject}</Text>
                    {isReplied && <View style={styles.badge}><Text style={styles.badgeText}>Cavab var</Text></View>}
                    {isClosed && <View style={[styles.badge, styles.badgeClosed]}><Text style={styles.badgeText}>Bağlı</Text></View>}
                </View>
                <Text style={styles.snippet} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </Pressable>
        );
    }

    if (mode === "create") {
        return (
            <SafeScreen>
                <View style={styles.header}>
                    <Pressable onPress={() => setMode("list")} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </Pressable>
                    <Text style={styles.title}>Yeni Müraciət</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.content}>
                    <SelectField
                        label="Mövzu"
                        options={CATEGORIES}
                        value={cat}
                        onChange={setCat}
                        placeholder="Seçin"
                    />
                    <Input
                        label="Mesajınız"
                        value={msg}
                        onChangeText={setMsg}
                        multiline
                        numberOfLines={6}
                        placeholder="Problemi ətraflı təsvir edin..."
                    />
                    <View style={{ height: 20 }} />
                    <PrimaryButton title="Göndər" onPress={sendTicket} loading={creating} />
                </View>
            </SafeScreen>
        );
    }

    if (mode === "detail" && activeTicket) {
        const msgs = activeTicket.support_messages || [];
        // sort by date just in case
        msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return (
            <SafeScreen>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <Pressable onPress={() => setMode("list")} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={Colors.text} />
                        </Pressable>
                        <Text style={styles.title}>Müraciət #{activeTicket.id.slice(0, 4)}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <FlatList
                        data={msgs}
                        keyExtractor={(m) => String(m.id)}
                        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                        renderItem={({ item }) => {
                            const isAdmin = item.is_admin;
                            return (
                                <View style={[styles.msgBox, isAdmin ? styles.msgAdmin : styles.msgUser]}>
                                    <Text style={[styles.msgText, isAdmin ? styles.msgTextAdmin : styles.msgTextUser]}>{item.message}</Text>
                                    <Text style={[styles.msgDate, isAdmin ? styles.msgDateAdmin : null]}>
                                        {new Date(item.created_at).toLocaleString()}
                                    </Text>
                                </View>
                            );
                        }}
                        ListHeaderComponent={
                            <View style={{ marginBottom: 20, padding: 16, backgroundColor: Colors.primarySoft, borderRadius: 12 }}>
                                <Text style={{ fontWeight: '900', color: Colors.primary, marginBottom: 4 }}>{activeTicket.subject}</Text>
                                <Text style={{ color: Colors.text }}>STATUS: {activeTicket.status.toUpperCase()}</Text>
                            </View>
                        }
                    />

                    <View style={styles.chatInput}>
                        <Input
                            value={replyMsg}
                            onChangeText={setReplyMsg}
                            placeholder="Cavab yazın..."
                            style={{ flex: 1 }}
                        />
                        <Pressable onPress={sendReply} disabled={replying || !replyMsg} style={styles.sendBtn}>
                            <Ionicons name="send" size={20} color="#fff" />
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeScreen>
        );
    }

    return (
        <SafeScreen>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>Dəstək</Text>
                <Pressable onPress={() => setMode("create")} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </Pressable>
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(t) => t.id}
                contentContainerStyle={{ padding: 16 }}
                refreshing={loading}
                onRefresh={loadTickets}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={{ marginTop: 50, alignItems: 'center' }}>
                        <Text style={{ color: Colors.muted }}>Müraciət yoxdur</Text>
                        <PrimaryButton
                            title="Yeni müraciət yarat"
                            onPress={() => setMode("create")}
                            variant="outline"
                            style={{ marginTop: 20 }}
                        />
                    </View>
                }
            />
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.bg,
    },
    backBtn: { padding: 8, marginLeft: -8 },
    title: { fontSize: 18, fontWeight: "900", color: Colors.text },
    addBtn: { padding: 8, marginRight: -8 },
    content: { padding: 16 },

    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
    },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    subject: { fontWeight: "900", color: Colors.text, fontSize: 16, flex: 1 },
    snippet: { color: Colors.text, fontSize: 14, lineHeight: 20 },
    date: { marginTop: 8, color: Colors.muted, fontSize: 12 },

    badge: { backgroundColor: "#DEF7EC", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { color: "#03543F", fontSize: 10, fontWeight: "900" },
    badgeClosed: { backgroundColor: Colors.bg, },

    msgBox: {
        maxWidth: "85%",
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    msgUser: {
        alignSelf: "flex-end",
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    msgAdmin: {
        alignSelf: "flex-start",
        backgroundColor: "#E5E7EB",
        borderBottomLeftRadius: 4,
    },
    msgText: { fontSize: 15, lineHeight: 22 },
    msgTextUser: { color: "#fff" },
    msgTextAdmin: { color: Colors.text },
    msgDate: { marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.7)", alignSelf: "flex-end" },
    msgDateAdmin: { color: Colors.muted },

    chatInput: {
        padding: 12,
        borderTopWidth: 1,
        borderColor: Colors.border,
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
        backgroundColor: "#fff"
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    }
});
