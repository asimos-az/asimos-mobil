import React, { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Colors } from "../theme/colors";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext";

const OPTIONS = [
    { id: 'uygun', text: '👍 Uyğundur', score: 5 },
    { id: 'vaxt', text: '👎 Vaxt itkisidir', score: 1 },
    { id: 'risk', text: '⚠️ Risklidir', score: 1 },
    { id: 'maas', text: '💰 Maaş azdır', score: 2 },
    { id: 'subheli', text: '🔍 Şübhəli görünür', score: 1 },
];

export function RateUserModal({ visible, onClose, targetId, jobId, onSuccess }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function submit() {
        if (!selectedOption) {
            toast.show("Zəhmət olmasa birini seçin", "error");
            return;
        }
        setLoading(true);
        try {
            const finalComment = selectedOption.text + (comment.trim() ? `\n\nƏtraflı: ${comment.trim()}` : "");
            await api.rateUser({ target_id: targetId, job_id: jobId, score: selectedOption.score, comment: finalComment });
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
                    <Text style={styles.sub}>
                        Sənin bu rəyin digər insanlara doğru işi tapmaqda kömək edəcək!
                    </Text>

                    <View style={styles.optionsRow}>
                        {OPTIONS.map((opt) => {
                            const isActive = selectedOption?.id === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.optionBtn, isActive && styles.optionBtnActive]}
                                    onPress={() => setSelectedOption(opt)}
                                >
                                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                                        {opt.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedOption && (
                        <TextInput
                            style={styles.input}
                            placeholder={selectedOption.id === 'subheli' ? "Niyə şübhəli göründü? (Yalnız admin görəcək)" : "Ətraflı rəyiniz (könüllü)..."}
                            multiline
                            value={comment}
                            onChangeText={setComment}
                        />
                    )}

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
    sub: { color: Colors.muted, marginBottom: 20, textAlign: "center", fontSize: 13, lineHeight: 18 },
    optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20, justifyContent: "center" },
    optionBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: "#F8FAFC",
    },
    optionBtnActive: {
        borderColor: Colors.primary,
        backgroundColor: "#EFF6FF",
    },
    optionText: { color: Colors.text, fontWeight: "600", fontSize: 14 },
    optionTextActive: { color: Colors.primary },
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
