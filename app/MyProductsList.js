import React, { useState, useEffect, useContext, useCallback, memo } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
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
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { token } = useContext(AuthContext);
  const [waitingModalVisible, setWaitingModalVisible] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollingError, setPollingError] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState(null);

  // Function to trigger a manual refresh
  const refreshReservations = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to fetch reservations data
  const fetchReservations = useCallback(async () => {
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

      console.log("Fetching reservations from:", `${API_URL}/api/bookings/reservations/`);
      const response = await axios.get(
        `${API_URL}/api/bookings/reservations/`, 
        { headers }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        console.log("Setting reservations:", response.data);
        setReservations(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error.message);
      console.error("Error response:", error.response?.data);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations, refreshTrigger, selectedTab]);

  // Handle cancellation of a reservation
  const handleCancelReservation = useCallback(async (reservationId) => {
    if (!token || !reservationId) return;
    
    try {
      // Optimistic UI update
      setReservations(prev => 
        prev.filter(item => item.id !== reservationId)
      );
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      await axios.delete(
        `${API_URL}/api/bookings/cancel/${reservationId}/`,
        { headers }
      );
    } catch (error) {
      console.error("Error cancelling reservation:", error.message);
      // Revert optimistic update if the API call failed
      refreshReservations();
    }
  }, [token, refreshReservations]);

  // Initiate Return Handler
  const handleInitiateReturn = useCallback(async (bookingId) => {
    if (!token || !bookingId) return;
    setCurrentBookingId(bookingId);
    setWaitingModalVisible(true);
    setPollingError(null);
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await axios.post(
        `${API_URL}/api/bookings/initiate-return/${bookingId}/`,
        {},
        { headers }
      );
      console.log("Return initiated response:", response.data);
      // Start polling for status
      setPolling(true);
      pollReturnStatus(bookingId);
    } catch (error) {
      console.error("Error initiating return:", error.response?.data || error.message);
      setWaitingModalVisible(false);
      Alert.alert("Error", "Failed to initiate return request.");
    }
  }, [token]);

  // Polling function
  const pollReturnStatus = useCallback((bookingId) => {
    let attempts = 0;
    const maxAttempts = 30; // ~1 min
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPolling(false);
        setPollingError("Timeout waiting for rider to accept return.");
        return;
      }
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const response = await axios.get(
          `${API_URL}/api/bookings/delivery-details/${bookingId}/`,
          { headers }
        );
        console.log("Polling return status:", response.data.return_status);
        if (response.data.return_status === 'in_return') {
          setPolling(false);
          setWaitingModalVisible(false);
          setPollingError(null);
          router.push(`/ReturnMapsScreen?bookingId=${bookingId}`);
          return;
        }
      } catch (error) {
        console.error("Error polling return status:", error);
        setPollingError("Error polling return status.");
      }
      attempts++;
      setTimeout(poll, 2000);
    };
    poll();
  }, [token]);

  // Debug render - display token status and API details (only in development)
  const renderDebugInfo = useCallback(() => {
    if (__DEV__) {
      return (
        <View style={{ padding: 10, borderWidth: 1, borderColor: '#666', marginBottom: 10 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>Token: {token ? "Available" : "Not available"}</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>API URL: {API_URL}/api/bookings/reservations/</Text>
          <Text style={{ color: 'white', fontSize: 12 }}>Reservations count: {reservations.length}</Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#555', padding: 5, borderRadius: 5, marginTop: 5 }}
            onPress={refreshReservations}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  }, [token, reservations.length, refreshReservations]);

  // Memoized reservation card component
  const ReservationCard = memo(({ item }) => {
    console.log("Rendering Reservation Card with item:", {
      id: item.id,
      total_price: item.total_price,
      item_name: item.item_name,
      delivery_status: item.delivery_status,
      return_status: item.return_status
    });
    
    return (
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
            <Text className="text-xs text-gray-400">
              Status: {item.delivery_status === 'delivered' ? 'Delivered' : 
                      item.delivery_status === 'in_delivery' ? 'In Delivery' : 'Pending'}
            </Text>
          </View>
        </View>
        {selectedTab === "reservation" && (
          <TouchableOpacity
            className="mt-2 bg-orange-500 p-2 rounded-lg"
            onPress={() => handleInitiateReturn(item.id)}
          >
            <Text className="text-white text-center">
              Initiate Return
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
    );
  });

  // Handlers for tab selection
  const handleReservationTab = useCallback(() => {
    setSelectedTab("reservation");
  }, []);

  const handleCompletedTab = useCallback(() => {
    setSelectedTab("completed");
  }, []);

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
            onPress={handleReservationTab}
            className={`p-2 ${
              selectedTab === "reservation" ? "border-b-2 border-blue-500" : ""
            }`}
          >
            <Text className="text-lg font-semibold text-white">
              Reservation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCompletedTab}
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
              <ReservationCard 
                key={item.id || `reservation-${Math.random()}`} 
                item={item} 
              />
            ))
          )}
        </ScrollView>
      </View>
      <Modal
        transparent={true}
        visible={waitingModalVisible}
        animationType="slide"
        onRequestClose={() => setWaitingModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View className="bg-white p-7 rounded-2xl w-[90%] max-w-[400px] items-center">
            <Text className="text-2xl text-center font-bold mt-5 text-black">Waiting for Rider to Accept Return</Text>
            <Text className="text-md text-gray-500 text-center mt-3 mb-4">Your return request has been sent. Please wait for the rider/owner to accept the return.</Text>
            {pollingError && <Text className="text-red-500 text-center mb-2">{pollingError}</Text>}
            <ActivityIndicator size="large" color="#FFA001" style={{ marginVertical: 10 }} />
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
              onPress={() => {
                if (currentBookingId) pollReturnStatus(currentBookingId);
              }}
            >
              <Text className="text-white text-center">Refresh Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2 bg-gray-400 px-4 py-2 rounded-lg"
              onPress={() => setWaitingModalVisible(false)}
            >
              <Text className="text-black text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
