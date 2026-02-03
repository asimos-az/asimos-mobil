import React, { useEffect, useState } from "react";
import { StyleSheet, View, Pressable, ActivityIndicator, Text } from "react-native";
import { SafeScreen } from "../../components/SafeScreen";
import { Colors } from "../../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../../api/client";
import { WebView } from "react-native-webview";

export function TermsScreen() {
    const nav = useNavigation();
    const route = useRoute();
    const slug = route.params?.slug || "terms";
    const titleOverride = route.params?.title;

    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await api.getContent(slug);
                setContent(data);
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);

    const displayTitle = titleOverride || content?.title || "Məlumat";

    // Prepare HTML content
    const htmlContent = content ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
              padding: 20px; 
              color: ${Colors.text}; 
              margin: 0; 
              line-height: 1.6;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 100%;
              overflow-x: hidden;
            }
            img { max-width: 100%; height: auto; }
            h1, h2, h3 { color: ${Colors.primary}; margin-top: 1.5em; margin-bottom: 0.5em; word-wrap: break-word; }
            p { margin-bottom: 1em; }
            ul, ol { padding-left: 20px; margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }
            a { color: ${Colors.primary}; text-decoration: none; font-weight: bold; word-wrap: break-word; }
            strong { font-weight: 800; }
          </style>
        </head>
        <body>
          ${content.body}
        </body>
      </html>
    ` : null;

    return (
        <SafeScreen>
            <View style={styles.header}>
                <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </Pressable>
                <Text style={styles.title}>{displayTitle}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.contentContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                ) : content ? (
                    <WebView
                        originWhitelist={['*']}
                        source={{ html: htmlContent }}
                        style={styles.webview}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle-outline" size={48} color={Colors.muted} />
                        <Text style={styles.errorText}>Məlumat tapılmadı.</Text>
                    </View>
                )}
            </View>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.bg,
    },
    backBtn: { padding: 4, marginLeft: -4 },
    title: { fontSize: 18, fontWeight: "800", color: Colors.text },

    contentContainer: { flex: 1, backgroundColor: '#fff' },
    webview: { flex: 1, backgroundColor: 'transparent' },

    errorBox: { alignItems: "center", marginTop: 60, gap: 12 },
    errorText: { color: Colors.muted, fontWeight: "600", fontSize: 16 },
});
