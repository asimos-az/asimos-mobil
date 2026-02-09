import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Colors } from '../theme/colors';

export function CustomAlert({ visible, title, message, buttons = [], onClose }) {
    const [fadeAnim] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    // Default button if none provided
    const activeButtons = buttons.length > 0 ? buttons : [{ text: 'OK', onPress: onClose }];

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

                <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}

                    <View style={styles.buttonRow}>
                        {activeButtons.map((btn, idx) => {
                            const isCancel = btn.style === 'cancel';
                            const isDestructive = btn.style === 'destructive';

                            return (
                                <Pressable
                                    key={idx}
                                    style={({ pressed }) => [
                                        styles.button,
                                        pressed && { opacity: 0.7 }
                                    ]}
                                    onPress={() => {
                                        if (btn.onPress) btn.onPress();
                                        else onClose(); // Close if no handler, or handler should close it? 
                                        // Usually handler calls logic then close. Context will handle close if wrapped.
                                    }}
                                >
                                    <Text style={[
                                        styles.btnText,
                                        isCancel && styles.btnTextCancel,
                                        isDestructive && styles.btnTextDestructive,
                                        !isCancel && !isDestructive && styles.btnTextPrimary
                                    ]}>
                                        {btn.text?.toUpperCase()}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        width: '85%',
        backgroundColor: '#333333', // Dark background as per user screenshot (dark grey) or white?
        // User screenshot 1: White background/Light Grey.
        // User screenshot 2: Dark Grey background?
        // Let's look at uploaded image 1770624475069.
        // Image 1: "ÇIXIŞ" - Dark grey popup on white bg.
        // Image 2: "Şifrə Bərpası" - Dark grey popup.
        // It seems the popup itself is dark grey (#333 or similar) and text is white.
        // Re-checking uploaded images... 
        // Image 1 (Logout): Background is white (app), Modal is Dark Grey card. Text White. "İMTİNA" (Greenish), "ÇIX" (Greenish).
        // Image 2 (Success): Background is white/blue pattern, Modal is Dark Grey card. Text White. "OK" (Greenish).
        // So the design is: Dark Grey Card, White Text, Greenish Action Text.
        backgroundColor: '#374151', // Dark grey (Tailwind coolGray-700)
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F9FAFB', // White
        marginBottom: 8,
    },
    message: {
        fontSize: 16,
        color: '#D1D5DB', // Light grey
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 20,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    btnText: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    btnTextPrimary: {
        color: '#10B981', // Emerald 500 equivalent (Greenish from screenshot)
    },
    btnTextCancel: {
        color: '#9CA3AF', // Gray 400
    },
    btnTextDestructive: {
        color: '#EF4444', // Red 500
    }
});
