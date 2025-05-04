import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import CustomButton from "../components/CustomButton";
import ReactNativeModal from "react-native-modal";
import Rlogo from "../assets/images/RLogo.png";
import { router, useLocalSearchParams } from "expo-router";
import axios from 'axios';
import { API_URL } from "@env";
import AuthContext from "./context/AuthContext";

// Sample locations in Karachi
const karachiLocations = [
  { latitude: 24.8607, longitude: 67.0011, name: "Saddar Town" }, // Approx. Saddar
  { latitude: 24.9263, longitude: 67.0239, name: "Gulshan-e-Iqbal" }, // Approx. Gulshan
  { latitude: 24.8934, longitude: 67.0626, name: "Defence Housing Authority (DHA)" }, // Approx. DHA
];

const Riderscreen = () => {
  const { bookingId } = useLocalSearchParams();
  const { token } = useContext(AuthContext);

  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [success, setSuccess] = useState(false);
  const [itemReceived, setItemReceived] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const latestIndexRef = useRef(0);

  const animatedLatitude = useRef(new Animated.Value(0)).current;
  const animatedLongitude = useRef(new Animated.Value(0)).current;

  const animatedCoordinate = {
    latitude: animatedLatitude,
    longitude: animatedLongitude,
  };

  // Select a random origin location on component mount
  const [origin, setOrigin] = useState(() => {
    const randomIndex = Math.floor(Math.random() * karachiLocations.length);
    return karachiLocations[randomIndex];
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId || !token) {
        setError("Missing booking ID or authentication token.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching booking details for ID: ${bookingId}`);
        const response = await axios.get(`${API_URL}/api/bookings/delivery-details/${bookingId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Booking details fetched:", response.data);
        setBookingDetails(response.data);
      } catch (err) {
        console.error("Error fetching booking details:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch booking details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, token]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !origin) return; // Check for origin as well

      const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${userLocation.longitude},${userLocation.latitude}?overview=full&geometries=geojson`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes.length) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            ([lng, lat]) => ({ latitude: lat, longitude: lng })
          );
          setRoute(coordinates);
        }
      } catch (err) {
        console.error("Error fetching route:", err);
      }
    };

    fetchRoute();
  }, [userLocation, origin]); // Add origin to dependency array

  useEffect(() => {
    if (route.length >= 2) {
      animateStep(latestIndexRef.current);
    }
  }, [route]);

  const animateStep = (index) => {
    if (index >= route.length - 1) {
      setSuccess(true);
      return;
    }

    const next = route[index + 1];
    const duration = 500;

    Animated.parallel([
      Animated.timing(animatedLatitude, {
        toValue: next.latitude,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(animatedLongitude, {
        toValue: next.longitude,
        duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      latestIndexRef.current = index + 1;
      setCurrentIndex(index + 1);
      setTimeout(() => {
        animateStep(index + 1);
      }, 50);
    });
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(timeString).toLocaleTimeString(undefined, options);
  };

  const logo = { uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png" };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#FFA001" />
        <Text className="text-white mt-2">Loading Booking Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Text className="text-red-500 text-center text-lg">Error</Text>
        <Text className="text-white text-center mt-2">{error}</Text>
        <CustomButton title="Go Back" handlePress={() => router.back()} containerStyles="mt-4" />
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-primary p-4">
        <Text className="text-white text-center">Booking details not found.</Text>
        <CustomButton title="Go Back" handlePress={() => router.back()} containerStyles="mt-4" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center mt-8 px-4">
          <MapView
            style={{ width: "100%", height: 300, borderRadius: 20 }}
            region={{
              latitude: origin.latitude,
              longitude: origin.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={origin} title="Sender Location" pinColor="green" />
            {userLocation && (
              <Marker coordinate={userLocation} title="Your Location" pinColor="red" />
            )}
            {route.length >= 2 && (
              <>
                <Marker.Animated coordinate={animatedCoordinate} title="Rider">
                  <Image source={logo} style={{ width: 40, height: 40 }} />
                </Marker.Animated>
                <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
              </>
            )}
          </MapView>

          <View className="mt-4 flex flex-row items-center justify-center bg-black-100 rounded-lg shadow-sm shadow-neutral-300 mb-3 border border-white border-0.5">
            <View className="flex flex-col items-start justify-center p-3">
              <View className="flex flex-row items-center justify-between">
                <Image source={Rlogo} className="w-[80px] h-[90px] rounded-lg" />
                <View className="flex flex-col mx-5 gap-y-5 flex-1">
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      {`Sender Location (${origin.name})`}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      {bookingDetails.destination_address || "Your Location"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-col w-full mt-5 bg-black-100 rounded-lg p-3 items-start justify-center">
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Date & Time</Text>
                  <Text className="text-md font-JakartaBold text-white" numberOfLines={1}>
                    {formatDate(bookingDetails.booking_created_at || new Date())}, {formatTime(bookingDetails.booking_created_at || new Date())}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Rentee</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails.rentee_name || "Rentee"}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Product</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {bookingDetails.item_title || "Booked Item"}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between">
                  <Text className="text-md font-JakartaMedium text-white">Payment Status</Text>
                  <Text
                    className={`text-md capitalize font-JakartaBold ${
                      bookingDetails.payment_status === "completed" || bookingDetails.payment_status === "paid" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {bookingDetails.payment_status || "Unknown"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <CustomButton
            title="Proceed"
            disabled={!itemReceived}
            containerStyles={`mt-2 w-full ${
              itemReceived ? "bg-orange-500" : "bg-orange-300"
            }`}
            handlePress={() => {
              if (itemReceived) {
                router.push("/home");
              }
            }}
          />
        </View>
      </ScrollView>

      <ReactNativeModal
        isVisible={success}
        backdropOpacity={0.8}
        coverScreen={true}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">
            Your Item has arrived!
          </Text>
          <Text className="text-md text-gray-500 text-center mt-3">
            Please collect your product from the rider. Thank you!
          </Text>
          <CustomButton
            title="Item Received"
            containerStyles="mt-5 w-full bg-orange-500"
            handlePress={() => {
              setSuccess(false);
              setItemReceived(true); // Enable Proceed button
            }}
          />
        </View>
      </ReactNativeModal>
    </KeyboardAvoidingView>
  );
};

export default Riderscreen;
