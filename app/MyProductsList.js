import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from 'axios';
import { API_URL } from "@env";
import AuthContext from "./context/AuthContext";

const MyProductsList = () => {
  const [selectedTab, setSelectedTab] = useState("reservation");
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchReservations();
  }, [token]);

  const fetchReservations = async () => {
    if (!token) {
      console.error('No auth token found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Log the full API URL for debugging
      const fullUrl = `${API_URL}/api/bookings/reservations/`;
      console.log("Fetching reservations from:", fullUrl);
      console.log("Headers:", headers);

      const response = await axios.get(
        `${API_URL}/api/bookings/reservations/`, 
        { headers }
      );
      
      console.log("API Response status:", response.status);
      console.log("API Response data length:", response.data ? response.data.length : 0);
      console.log("API Response data:", JSON.stringify(response.data));
      
      if (response.data && Array.isArray(response.data)) {
        setReservations(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
      } else if (error.request) {
        console.error("No response received:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // This is just a placeholder function - you can implement it later if needed
  const handleCancelReservation = (reservationId) => {
    console.log("Cancel reservation", reservationId);
  };

  // Debug render - display token status and API details
  const renderDebugInfo = () => {
    if (__DEV__) {
      return (
        <View style={{ padding: 10, borderWidth: 1, borderColor: '#666', marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>Token: {token ? "Available" : "Not available"}</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>API URL: {API_URL}/api/bookings/reservations/</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>Reservations count: {reservations.length}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#555', padding: 5, borderRadius: 5, marginTop: 5 }}
            onPress={fetchReservations}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
      </View>
      <View className="flex-1 p-5 bg-[#161622]">
        <View className="flex-row justify-center">
          <TouchableOpacity
            onPress={() => setSelectedTab("reservation")}
            className={`p-2 ${
              selectedTab === "reservation" ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text className="text-lg font-semibold text-white">
              Reservation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab("completed")}
            className={`p-2 ${
              selectedTab === "completed" ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text className="text-lg font-semibold text-white">Completed</Text>
          </TouchableOpacity>
        </View>

        {renderDebugInfo()}

        <ScrollView className="mt-4">
          {loading ? (
            <View className="items-center justify-center p-4">
              <ActivityIndicator size="large" color="#3498db" />
              <Text className="text-white mt-2">Loading reservations...</Text>
            </View>
          ) : reservations.length === 0 ? (
            <Text className="text-center text-white mt-4">
              No reservations found
            </Text>
          ) : (
            reservations.map((item) => (
              <View
                key={item.id || `reservation-${Math.random()}`}
                className="bg-[#1E1E2D] rounded-lg p-4 mb-4 shadow-md"
              >
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    className="w-16 h-16 rounded-lg mr-4"
                    style={{ width: 64, height: 64, borderRadius: 8, marginRight: 15 }}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">
                      {item.item_name}
                    </Text>
                    <Text className="text-white">
                      Owner: {item.owner_name}
                    </Text>
                    {item.start_date && item.end_date && (
                      <Text className="text-xs text-gray-400">
                        {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                      </Text>
                    )}
                    {item.total_price && (
                      <Text className="text-blue-400">
                        Total: PKR {item.total_price}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedTab === "reservation" && (
                  <TouchableOpacity
                    className="mt-2 bg-green-500 p-2 rounded-lg"
                    onPress={() => router.push('Paymentgateway')}
                  >
                    <Text className="text-white text-center">
                      Make Payment
                    </Text>
                  </TouchableOpacity>
                )}
                {selectedTab === "completed" && (
                  <TouchableOpacity
                    className="mt-2 bg-red-500 p-2 rounded-lg"
                    onPress={() => router.push('DisputeForm')}
                  >
                    <Text className="text-white text-center">
                      File Dispute
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#FFFFFF",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFFFFF",
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: "FFFFFF",
  },
  sportsCategory: {
    backgroundColor: "#005fff", // Navy blue
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-end",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
});

export default MyProductsList;
