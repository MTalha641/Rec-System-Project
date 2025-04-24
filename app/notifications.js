import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import moment from "moment";
import logo from "../assets/images/RLogo.png";
import axios from "axios";
import { API_URL } from "@env";
import { AuthContext } from "./context/AuthContext";

const Notifications = () => {
  const { token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!token) {
      console.warn("No token available!");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(
        "Error fetching notifications:",
        error.response?.data || error.message
      );
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${API_URL}/api/notifications/${notificationId}/mark-read/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the local state to mark this notification as read
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

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
    <TouchableOpacity
      style={[
        styles.card,
        { 
          opacity: item.is_read ? 0.7 : 1,
          backgroundColor: item.is_read ? "#2A2A3A" : "#1E1E2D"
        }
      ]}
      onPress={() => {
        if (!item.is_read) {
          markAsRead(item.id);
        }
      }}
    >
      <Image source={logo} resizeMode="contain" style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {item.sender_details?.username || "System"}
        </Text>
        <Text style={styles.time}>
          {moment(item.created_at).format("MMMM Do YYYY, h:mm a")}
        </Text>
        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.status,
              { backgroundColor: getStatusColor(item.notification_type) },
            ]}
          >
            <Text style={styles.statusText}>
              {getNotificationLabel(item.notification_type)}
            </Text>
          </View>
          
          {!item.is_read && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>New</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity 
            style={styles.markAllReadButton}
            onPress={async () => {
              try {
                await axios.post(
                  `${API_URL}/api/notifications/mark-all-read/`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                
                // Update all notifications to read in local state
                setNotifications(
                  notifications.map(n => ({...n, is_read: true}))
                );
                
                Alert.alert("Success", "All notifications marked as read");
              } catch (error) {
                console.error("Error marking all as read:", error);
                Alert.alert("Error", "Failed to mark all as read");
              }
            }}
          >
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <NotificationCard key={item.id} item={item} />
            ))
          ) : (
            <Text style={styles.emptyText}>No Notifications</Text>
          )}
        </ScrollView>
      )}
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
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E2D",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginBottom: 11,
    elevation: 1,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    color: "#AAAAAA",
    fontSize: 12,
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
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
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  unreadBadge: {
    backgroundColor: "#475FCB",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  unreadText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyText: {
    alignSelf: "center",
    fontSize: 16,
    color: "#fff",
    marginTop: 40,
  },
  markAllReadButton: {
    backgroundColor: "#475FCB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  markAllReadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default Notifications;
