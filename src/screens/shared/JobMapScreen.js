import React from "react";
import { StyleSheet, View, Pressable, Text } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MapPreview } from "../../components/MapPreview";

export function JobMapScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const { job, userLocation } = route.params || {};

    return (
        <SafeScreen>
            <View style={styles.header}>
                <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={26} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>Xəritə</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.body}>
                <MapPreview
                    userLocation={userLocation}
                    jobLocation={job?.location}
                    height="100%"
                />
            </View>
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
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    title: {
        fontSize: 18,
        fontWeight: "900",
        color: Colors.text,
    },
    body: {
        flex: 1,
        backgroundColor: "#fff",
    },
});
