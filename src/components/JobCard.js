import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";

function formatDistance(distanceM) {
  if (typeof distanceM !== "number") return null;
  if (distanceM >= 1000) {
    const km = distanceM / 1000;
    return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
  }
  return `${Math.round(distanceM)} m`;
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function JobCard({ job, onPress, showDailyBadge = true }) {
  const isDaily = !!job?.isDaily;
  const distDisplay = formatDistance(job?.distanceM);
  const companyLabel = job?.company || "Asimos İşəgötürən";
  const typeLabel = job?.category || "Vakansiya";
  const dateDisplay = formatDate(job?.created_at || job?.createdAt);
  
  const rawWage = job?.wage ? String(job.wage).replace(/AZN|₼/gi, "").trim() : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}>
      {showDailyBadge ? (
        <View style={styles.badgeContainer}>
            <View style={[styles.statePill, isDaily ? styles.stateSuccess : styles.stateInfo]}>
              <Ionicons
                name={isDaily ? "checkmark" : "time-outline"}
                size={14}
                color={isDaily ? "#16A34A" : "#D97706"}
              />
              <Text style={[styles.stateText, isDaily ? styles.stateSuccessText : styles.stateInfoText]}>
                {isDaily ? "Gündəlik iş" : "Elan"}
              </Text>
            </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.row}>
           <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.title} numberOfLines={1}>{job?.title || "Vakansiya"}</Text>
           </View>
           <View style={{ alignItems: "flex-end" }}>
              {dateDisplay ? <Text style={styles.dateText}>{dateDisplay}</Text> : null}
              {distDisplay ? <Text style={styles.statusText}>{distDisplay} uzaqda</Text> : <Text style={styles.statusText}>Ətraflı bax</Text>}
           </View>
        </View>

        <View style={styles.rowTopMargin}>
          <View style={styles.leftCol}>
             <Text style={styles.meta} numberOfLines={1}>{companyLabel}</Text>
             <Text style={styles.meta} numberOfLines={1}>{typeLabel}</Text>
          </View>
          <View style={styles.rightCol}>
            {rawWage ? (
              <Text style={styles.amount} numberOfLines={1}>
                {rawWage} <Text style={styles.currencyText}>AZN</Text>
              </Text>
            ) : (
              <Text style={styles.amount} numberOfLines={1}>Razılaşma ilə</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  badgeContainer: {
     marginBottom: -12,
     paddingHorizontal: 16,
     zIndex: 10,
  },
  statePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  stateSuccess: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  stateInfo: {
    backgroundColor: "#FEFCE8",
    borderColor: "#FEF08A",
  },
  stateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  stateSuccessText: {
    color: "#16A34A",
  },
  stateInfoText: {
    color: "#D97706",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rowTopMargin: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  rightCol: {
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  statusText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "400",
  },
  meta: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
    fontWeight: "500",
  },
  currencyText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
});
