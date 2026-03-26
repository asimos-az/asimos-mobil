import React, { useEffect, useState, useRef } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View, TextInput, Alert, ScrollView } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../../components/Input";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/SelectField";
import { styles } from "./SupportScreen.styles";

const EMPLOYER_CATEGORIES = [
    "Elan yükləyə bilmirəm",
    "Namizədlərlə əlaqə problemi",
    "Ödəniş problemi",
    "Hesab ilə bağlı problem",
    "Təklif və İradlar",
    "Digər"
];

const SEEKER_CATEGORIES = [
    "İşə müraciət edə bilmirəm",
    "Profilimi tamamlaya bilmirəm",
    "Hesab ilə bağlı problem",
    "Təklif və İradlar",
    "Digər"
];

export function SupportScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();
    const toast = useToast();
    const [mode, setMode] = useState("list"); // list, create, detail
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isEmployer = user?.role === "employer";
    const currentCategories = isEmployer ? EMPLOYER_CATEGORIES : SEEKER_CATEGORIES;

    // Create state
    const [cat, setCat] = useState("");
    const [msg, setMsg] = useState("");
    const [creating, setCreating] = useState(false);

    // Detail state
    const flatListRef = useRef(null);
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyMsg, setReplyMsg] = useState("");
    const [replying, setReplying] = useState(false);

    useEffect(() => {
        loadTickets();
        
        // Simple polling for a real-time chat feel
        const interval = setInterval(() => {
            if (!loading) loadTickets(true);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    async function loadTickets(silent = false) {
        try {
            if (!silent) setLoading(true);
            const res = await api.listTickets();
            if (res?.items) {
                setTickets(res.items);
                // If we are viewing an active ticket, update it with fresh data
                setActiveTicket(prev => {
                    if (!prev) return null;
                    const fresh = res.items.find(t => t.id === prev.id);
                    return fresh || prev;
                });
            }
        } catch (e) {
            // ignore
        } finally {
            if (!silent) setLoading(false);
        }
    }

    async function sendTicket() {
        if (!cat && !msg) return;
        if (!msg) {
            toast.show("Mesaj yazın", "error");
            return;
        }
        if (!cat) {
            toast.show("Mövzu seçin", "error");
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
        const textToP = replyMsg.trim();
        if (!textToP) return;
        try {
            setReplying(true);
            await api.replyTicket(activeTicket.id, textToP);
            setReplyMsg("");

            // Update local state optimistic
            const newMsg = {
                id: Math.random(),
                message: textToP,
                created_at: new Date().toISOString(),
                sender_id: "me", // simplified
                is_admin: false
            };

            const updated = { ...activeTicket };
            if (!updated.support_messages) updated.support_messages = [];
            updated.support_messages.push(newMsg);
            setActiveTicket(updated);

            // Fetch latest to stay synced
            loadTickets();
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
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
                    {isReplied && <View style={[styles.badge, styles.badgeRepliedBg]}><Text style={[styles.badgeText, styles.badgeRepliedText]}>Cavab var</Text></View>}
                    {isClosed && <View style={[styles.badge, styles.badgeClosedBg]}><Text style={[styles.badgeText, styles.badgeClosedText]}>Bağlı</Text></View>}
                    {!isClosed && !isReplied && <View style={[styles.badge, styles.badgeOpenBg]}><Text style={[styles.badgeText, styles.badgeOpenText]}>Açıq</Text></View>}
                </View>
                <Text style={styles.snippet} numberOfLines={2}>{item.message}</Text>
                <View style={styles.footerRow}>
                    <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("az-AZ")}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                </View>
            </Pressable>
        );
    }

    async function handleDeleteTicket() {
        Alert.alert(
            "Bileti Sil",
            "Bu müraciəti qalıcı olaraq silmək istədiyinizə əminsiniz?",
            [
                { text: "Ləğv et", style: "cancel" },
                {
                    text: "Sil", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            await api.deleteTicket(activeTicket.id);
                            toast.show("Müraciət silindi", "success");
                            setMode("list");
                            loadTickets();
                        } catch (e) {
                            toast.show(e.message, "error");
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    }

    if (mode === "create") {
        return (
            <SafeScreen style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => setMode("list")} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </Pressable>
                    <Text style={styles.title}>Yeni Müraciət</Text>
                    <View style={{ width: 40 }} />
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                        <SelectField
                            label="Mövzu"
                            options={currentCategories}
                            value={cat}
                            onChange={setCat}
                            placeholder="Mövzunu seçin"
                        />
                        <View style={{ height: 16 }} />
                        <Input
                            label="Mesajınız"
                            value={msg}
                            onChangeText={setMsg}
                            multiline
                            numberOfLines={6}
                            placeholder="Problemi ətraflı təsvir edin..."
                            style={{ height: 120, textAlignVertical: 'top', paddingTop: 16 }}
                        />
                        <View style={{ height: 32 }} />
                        <PrimaryButton title="Müraciəti Göndər" onPress={sendTicket} loading={creating} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeScreen>
        );
    }

    if (mode === "detail" && activeTicket) {
        const msgs = activeTicket.support_messages || [];
        // sort by date ascending
        msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return (
            <SafeScreen style={styles.safeArea}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <Pressable onPress={() => setMode("list")} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={Colors.text} />
                        </Pressable>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981'}} />
                            <Text style={styles.title}>Adminlə Əlaqə</Text>
                        </View>
                        <Pressable onPress={handleDeleteTicket} disabled={deleting} style={{ width: 40, alignItems: 'flex-end' }}>
                            <Ionicons name="trash-outline" size={24} color={Colors.error || "red"} style={{ opacity: deleting ? 0.5 : 1 }} />
                        </Pressable>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={msgs}
                        keyExtractor={(m) => String(m.id)}
                        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        renderItem={({ item }) => {
                            const isAdmin = item.is_admin;
                            return (
                                <View style={[styles.msgBox, isAdmin ? styles.msgAdmin : styles.msgUser]}>
                                    {isAdmin && (
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4}}>
                                            <Ionicons name="headset" size={12} color={Colors.primary} />
                                            <Text style={{fontSize: 11, fontWeight: '800', color: Colors.primary}}>ASIMOS DƏSTƏK</Text>
                                        </View>
                                    )}
                                    <Text style={[styles.msgText, isAdmin ? styles.msgTextAdmin : styles.msgTextUser]}>{item.message}</Text>
                                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 6, gap: 4}}>
                                        <Text style={[styles.msgDate, isAdmin ? styles.msgDateAdmin : styles.msgDateUser]}>
                                            {new Date(item.created_at).toLocaleTimeString("az-AZ", {hour: '2-digit', minute:'2-digit'})}
                                        </Text>
                                        {!isAdmin && <Ionicons name="checkmark-done" size={14} color="rgba(0,0,0,0.4)" />}
                                    </View>
                                </View>
                            );
                        }}
                        ListHeaderComponent={
                            <View style={styles.ticketInfoBanner}>
                                <Text style={styles.ticketInfoTitle}>{activeTicket.subject}</Text>
                                <View style={styles.ticketInfoStatusRow}>
                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeTicket.status === 'closed' ? Colors.muted : Colors.primary }} />
                                    <Text style={styles.ticketInfoStatusText}>
                                        {activeTicket.status === 'closed' ? "BAĞLANDI" : "AÇIQ"}
                                    </Text>
                                </View>
                            </View>
                        }
                    />

                    {activeTicket.status !== 'closed' ? (
                        <View style={styles.chatInputWrap}>
                            <TextInput
                                value={replyMsg}
                                onChangeText={setReplyMsg}
                                placeholder="Mesaj yazın..."
                                style={styles.inputField}
                                multiline
                                maxHeight={100}
                                placeholderTextColor={Colors.muted}
                            />
                            <Pressable 
                                onPress={sendReply} 
                                disabled={replying || !replyMsg.trim()} 
                                style={[styles.sendBtn, (!replyMsg.trim() || replying) && styles.sendBtnDisabled]}
                            >
                                <Ionicons name="send" size={18} color={replyMsg.trim() ? "#fff" : Colors.muted} style={{ marginLeft: 2 }} />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.border }}>
                            <Text style={{ color: Colors.muted, fontWeight: '600' }}>Bu müraciət artıq bağlanıb.</Text>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeScreen>
        );
    }

    return (
        <SafeScreen style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>Dəstək</Text>
                <Pressable onPress={() => setMode("create")} style={styles.addBtn}>
                    <Ionicons name="add-circle" size={26} color={Colors.primary} />
                </Pressable>
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(t) => t.id}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={loadTickets}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyWrapper}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="chatbubbles-outline" size={36} color={Colors.muted} />
                        </View>
                        <Text style={styles.emptyTitle}>Sualınız var?</Text>
                        <Text style={styles.emptyDesc}>Bizə yazın, ən qısa zamanda cavablandıraq.</Text>
                        <PrimaryButton
                            title="+ Yeni Müraciət"
                            onPress={() => setMode("create")}
                        />
                    </View>
                }
            />
        </SafeScreen>
    );
}
