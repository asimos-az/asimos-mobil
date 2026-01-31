import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Animated, StyleSheet, Text, View, Platform, SafeAreaView } from "react-native";
import { Colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";

const ToastContext = createContext({});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-50)).current;
    const timerRef = useRef(null);

    const show = useCallback((message, type = "info") => {
        if (timerRef.current) clearTimeout(timerRef.current);

        setToast({ message, type });

        // Reset animation values
        opacity.setValue(0);
        translateY.setValue(-50);

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        timerRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: -50,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => setToast(null));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ show }}>
            {children}
            {toast && (
                <View style={styles.container} pointerEvents="none">
                    <SafeAreaView>
                        <Animated.View style={[
                            styles.card,
                            { opacity, transform: [{ translateY }] },
                            toast.type === "error" && styles.cardError,
                            toast.type === "success" && styles.cardSuccess,
                        ]}>
                            <Ionicons
                                name={toast.type === 'success' ? 'checkmark-circle' : toast.type === 'error' ? 'alert-circle' : 'information-circle'}
                                size={24}
                                color="#fff"
                            />
                            <Text style={styles.text}>{toast.message}</Text>
                        </Animated.View>
                    </SafeAreaView>
                </View>
            )}
        </ToastContext.Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: "center",
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    card: {
        backgroundColor: "#333",
        borderRadius: 50,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        marginHorizontal: 20,
    },
    cardSuccess: { backgroundColor: Colors.primary },
    cardError: { backgroundColor: "#E53935" },
    text: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
        flexShrink: 1,
    },
});
