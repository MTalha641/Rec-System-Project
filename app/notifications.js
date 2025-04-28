import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import moment from "moment";
import logo from "../assets/images/RLogo.png";

const notifications = () => {
  const dummyNotifications = [
    {
      id: "1",
      senderUsername: "JohnDoe",
      senderEmail: "johndoe@example.com",
      timeStamp: "2024-11-20T12:00:00Z",
      type: "approval",
      description: "Your rental request has been approved!",
    },
    {
      id: "2",
      senderUsername: "JaneSmith",
      senderEmail: "janesmith@example.com",
      timeStamp: "2024-11-19T14:20:00Z",
      type: "rejection",
      description: "Your request was rejected for item X.",
    },
    {
      id: "3",
      senderUsername: "Admin",
      senderEmail: "admin@rentspot.com",
      timeStamp: "2024-11-18T09:00:00Z",
      type: "completion",
      description: "Your order is marked as completed.",
    },
    {
      id: "4",
      senderUsername: "AliRental",
      senderEmail: "ali@store.com",
      timeStamp: "2024-11-17T18:45:00Z",
      type: "request",
      description: "AliRental sent you a new rental request.",
    },
  ];

  const getNotificationLabel = (type) => {
    switch (type) {
      case "approval":
        return "Approval";
      case "rejection":
        return "Rejection";
      case "completion":
        return "Completion";
      case "request":
        return "Request";
      default:
        return "Notification";
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case "approval":
        return "#FFA500"; // orange
      case "rejection":
        return "#FF4C4C"; // red
      case "completion":
        return "#4CAF50"; // green
      case "request":
        return "#ffc107"; // yellow
      default:
        return "#ccc"; // fallback
    }
  };

  const NotificationCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={logo} resizeMode="contain" style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {item.senderUsername.length > 25
            ? item.senderUsername.slice(0, 25) + "..."
            : item.senderUsername}
        </Text>
        <Text style={styles.time}>
          {moment(item.timeStamp).format("MMMM Do YYYY, h:mm a")}
        </Text>
        <Text style={styles.price}>{item.description}</Text>
        <Text style={styles.time}>{item.senderEmail}</Text>

        <View style={styles.bottomRow}>
          <View
            style={[styles.status, { backgroundColor: getStatusColor(item.type) }]}
          >
            <Text style={styles.statusText}>
              {getNotificationLabel(item.type)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView>
        {dummyNotifications.length > 0 ? (
          dummyNotifications.map((item) => (
            <NotificationCard key={item.id} item={item} />
          ))
        ) : (
          <Text style={{ alignSelf: "center", fontSize: 16, color: "#fff" }}>
            No Notifications
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#161622",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1E1E2D",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E2D",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 150,
    marginBottom: 11,
    elevation: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  time: {
    color: "#FFFFFF",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#000000",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 6,
  },
});

export default notifications;
