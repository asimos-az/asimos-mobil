import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../theme/colors';

export function OtpInput({ length = 6, value, onChange, disabled }) {
    const inputRef = useRef(null);
    const [focused, setFocused] = useState(false);

    const handlePress = () => {
        if (!disabled) {
            inputRef.current?.focus();
        }
    };

    const renderBoxes = () => {
        const boxes = [];
        for (let i = 0; i < length; i++) {
            const char = value[i] || "";
            const isCurrent = focused && value.length === i;

            boxes.push(
                <View
                    key={i}
                    style={[
                        styles.box,
                        char ? styles.boxFilled : null,
                        isCurrent ? styles.boxActive : null
                    ]}
                >
                    <Text style={styles.text}>{char}</Text>
                    {isCurrent && <View style={styles.cursor} />}
                </View>
            );
        }
        return boxes;
    };

    return (
        <Pressable onPress={handlePress} style={styles.container}>
            <View style={styles.boxContainer}>
                {renderBoxes()}
            </View>
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={(text) => {
                    if (disabled) return;
                    // Only allow numbers
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
                    onChange(cleaned);
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                textContentType="oneTimeCode"
                style={styles.hiddenInput}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={length}
                editable={!disabled}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        marginVertical: 20,
    },
    boxContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
    },
    box: {
        width: 45,
        height: 55,
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    boxFilled: {
        borderColor: Colors.primary,
        backgroundColor: '#eff6ff', // Light blue tint
    },
    boxActive: {
        borderColor: Colors.primary,
        borderWidth: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    text: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
    },
    cursor: {
        position: 'absolute',
        bottom: 8,
        width: 20,
        height: 2,
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
});
