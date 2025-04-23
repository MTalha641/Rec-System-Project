import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import CustomButton from "../components/CustomButton";
import ReactNativeModal from "react-native-modal";
import Rlogo from "../assets/images/RLogo.png";
import { router } from "expo-router";

const Riderscreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [success, setSuccess] = useState(false);
  const [itemReceived, setItemReceived] = useState(false); // New state
  const [currentIndex, setCurrentIndex] = useState(0);

  const latestIndexRef = useRef(0);

  const animatedLatitude = useRef(new Animated.Value(0)).current;
  const animatedLongitude = useRef(new Animated.Value(0)).current;

  const animatedCoordinate = {
    latitude: animatedLatitude,
    longitude: animatedLongitude,
  };

  const origin = {
    latitude: 25.056038,
    longitude: 67.118942,
  };

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
    const fetchRoute = async () => {
      if (!userLocation) return;

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
  }, [userLocation]);

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

  const ride = {
    origin_address: "Sender Location, Karachi",
    destination_address: "Your Current Location",
    created_at: "2024-02-11T10:30:00Z",
    ride_time: "2024-02-11T12:00:00Z",
    driver: {
      first_name: "John",
      last_name: "Doe",
      car_seats: "Table Tennis Racquet",
    },
    payment_status: "paid",
  };

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
                      {ride.origin_address}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-x-2">
                    <Image source={logo} className="w-5 h-5" />
                    <Text className="text-md font-JakartaMedium text-white" numberOfLines={1}>
                      {ride.destination_address}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-col w-full mt-5 bg-black-100 rounded-lg p-3 items-start justify-center">
                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Date & Time</Text>
                  <Text className="text-md font-JakartaBold text-white" numberOfLines={1}>
                    {formatDate(ride.created_at)}, {formatTime(ride.ride_time)}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Driver</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {ride.driver.first_name} {ride.driver.last_name}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between mb-5">
                  <Text className="text-md font-JakartaMedium text-white">Product</Text>
                  <Text className="text-md font-JakartaBold text-white">
                    {ride.driver.car_seats}
                  </Text>
                </View>

                <View className="flex flex-row items-center w-full justify-between">
                  <Text className="text-md font-JakartaMedium text-white">Payment Status</Text>
                  <Text
                    className={`text-md capitalize font-JakartaBold ${
                      ride.payment_status === "paid" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {ride.payment_status}
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
