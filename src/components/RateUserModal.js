import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

export function RateUserModal({ visible, onClose, targetId, jobId, onSuccess }) {
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function submit() {
        if (score < 1) {
            toast.show("Zəhmət olmasa ulduz seçin", "error");
            return;
        }
        setLoading(true);
        try {
            await api.rateUser({ target_id: targetId, job_id: jobId, score, comment });
            toast.show("Reytinqiniz qeydə alındı", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (e) {
            toast.show(e.message || "Reytinq göndərilmədi", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>İşəgötürəni qiymətləndir</Text>
                    <Text style={styles.sub}>Bu işlə bağlı təcrübənizi bölüşün</Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity key={s} onPress={() => setScore(s)}>
                                <Ionicons
                                    name={s <= score ? "star" : "star-outline"}
                                    size={32}
                                    color={Colors.primary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Rəyiniz (könüllü)..."
                        multiline
                        value={comment}
                        onChangeText={setComment}
                    />

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                            <Text style={styles.cancelText}>Ləğv et</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Göndər</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, alignItems: "center" },
    title: { fontSize: 20, fontWeight: "900", color: Colors.text, marginBottom: 6 },
    sub: { color: Colors.muted, marginBottom: 20, textAlign: "center" },
    starsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 12,
        height: 80,
        textAlignVertical: "top",
        marginBottom: 20,
        fontFamily: "System",
    },
    btnRow: { flexDirection: "row", gap: 12, width: "100%" },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.bg, alignItems: "center" },
    cancelText: { fontWeight: "700", color: Colors.text },
    submitBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: "center" },
    submitText: { fontWeight: "900", color: "#fff" },
});
