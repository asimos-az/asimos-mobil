import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useRoute } from "@react-navigation/native";

export function WebPageScreen() {
  const route = useRoute();
  const { url } = route.params || {};

  return (
    <View style={styles.container}>
      {url ? <WebView source={{ uri: url }} style={{ flex: 1 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
