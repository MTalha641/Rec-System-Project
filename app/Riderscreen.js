<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, Image } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Calendar } from "react-native-calendars";

import logo from "../assets/images/RLogo.png";

const Riderscreen = () => {
  const [riderLocation, setRiderLocation] = useState(null);
  const [destination, setDestination] = useState({
    latitude: 25.053109, // Your location
    longitude: 67.121006,
  });
  const [route, setRoute] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRiderLocation({
=======
import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import logo from '../assets/images/RLogo.png';

const Riderscreen = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);

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
>>>>>>> origin/AsherUpdate2
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
<<<<<<< HEAD
      if (!riderLocation) return;

      const url = `https://router.project-osrm.org/route/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes.length) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            })
          );
          setRoute(coordinates);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
=======
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
>>>>>>> origin/AsherUpdate2
      }
    };

    fetchRoute();
<<<<<<< HEAD
  }, [riderLocation]);

  const ride = {
    origin_address: "123 Main St, New York, NY",
    destination_address: "456 Elm St, Brooklyn, NY",
    destination_longitude: -73.935242,
    destination_latitude: 40.73061,
=======
  }, [userLocation]);

  useEffect(() => {
    if (route.length >= 2) {
      // Start the animation from index 0
      animateStep(0);
    }
  }, [route]);

  const animateStep = (index) => {
    if (index >= route.length - 1) return;
  
    const current = route[index];
    const next = route[index + 1];
    const duration = 500; // increased duration for smoothness
  
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
      // Introduce delay before moving to the next step
      setTimeout(() => {
        animateStep(index + 1);
      }, 50); // small delay adds natural pacing
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
>>>>>>> origin/AsherUpdate2
    created_at: "2024-02-11T10:30:00Z",
    ride_time: "2024-02-11T12:00:00Z",
    driver: {
      first_name: "John",
      last_name: "Doe",
      car_seats: "Table Tennis Racquet",
    },
    payment_status: "paid",
  };

<<<<<<< HEAD
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    const options = { hour: "2-digit", minute: "2-digit", hour12: true };
    return new Date(timeString).toLocaleTimeString(undefined, options);
  };

  return (
    <>
      <View className="flex-1 bg-primary items-center mt-8 p-4">
        <MapView
          style={{
            width: "100%",
            height: "50%",
            borderRadius: 20,
            overflow: "hidden",
          }}
          region={{
            latitude: riderLocation?.latitude || 25.056, // Default to some value
            longitude: riderLocation?.longitude || 67.12,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {riderLocation && (
            <Marker
              coordinate={riderLocation}
              title="Rider Location"
              pinColor="blue"
            />
          )}
          <Marker
            coordinate={destination}
            title="Your Location"
            pinColor="red"
          />

          {route.length > 0 && (
            <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
          )}
        </MapView>
        <View className=" mt-4 flex flex-row items-center justify-center bg-black-100 rounded-lg shadow-sm shadow-neutral-300 mb-3 border border-white border-0.5">
          <View className="flex flex-col items-start justify-center p-3">
            <View className="flex flex-row items-center justify-between">
              <Image
                source={{ uri: "https://via.placeholder.com/80x90" }}
                className="w-[80px] h-[90px] rounded-lg"
              />

              <View className="flex flex-col mx-5 gap-y-5 flex-1">
                <View className="flex flex-row items-center gap-x-2">
                  <Image source={logo} className="w-5 h-5" />
                  <Text
                    className="text-md font-JakartaMedium text-white"
                    numberOfLines={1}
                  >
                    {ride.origin_address}
                  </Text>
                </View>

                <View className="flex flex-row items-center gap-x-2">
                  <Image source={logo} className="w-5 h-5" />
                  <Text
                    className="text-md font-JakartaMedium text-white"
                    numberOfLines={1}
                  >
                    {ride.destination_address}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex flex-col w-full mt-5 bg-black-100 rounded-lg p-3 items-start justify-center">
              <View className="flex flex-row items-center w-full justify-between mb-5">
                <Text className="text-md font-JakartaMedium text-white">
                  Date & Time
                </Text>
                <Text className="text-md font-JakartaBold text-white" numberOfLines={1}>
                  {formatDate(ride.created_at)}, {formatTime(ride.ride_time)}
                </Text>
              </View>

              <View className="flex flex-row items-center w-full justify-between mb-5">
                <Text className="text-md font-JakartaMedium text-white">
                  Driver
                </Text>
                <Text className="text-md font-JakartaBold text-white">
                  {ride.driver.first_name} {ride.driver.last_name}
                </Text>
              </View>

              <View className="flex flex-row items-center w-full justify-between mb-5">
                <Text className="text-md font-JakartaMedium text-white">
                  Product
                </Text>
                <Text className="text-md font-JakartaBold text-white">
                  {ride.driver.car_seats}
                </Text>
              </View>

              <View className="flex flex-row items-center w-full justify-between">
                <Text className="text-md font-JakartaMedium text-white">
                  Payment Status
                </Text>
                <Text
                  className={`text-md capitalize font-JakartaBold ${
                    ride.payment_status === "paid"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {ride.payment_status}
=======
  return (
    <View className="flex-1 bg-primary items-center mt-8 p-4">
      <MapView
        style={{ width: "100%", height: "50%", borderRadius: 20 }}
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
          <Marker.Animated coordinate={animatedCoordinate} title="Rider">
            <Image
              source={{ uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png" }}
              style={{ width: 40, height: 40 }}
            />
          </Marker.Animated>
        )}

        {route.length >= 2 && (
          <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>

      <View className="mt-4 flex flex-row items-center justify-center bg-black-100 rounded-lg shadow-sm shadow-neutral-300 mb-3 border border-white border-0.5">
        <View className="flex flex-col items-start justify-center p-3">
          <View className="flex flex-row items-center justify-between">
            <Image
              source={{ uri: "https://via.placeholder.com/80x90" }}
              className="w-[80px] h-[90px] rounded-lg"
            />
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
>>>>>>> origin/AsherUpdate2
                </Text>
              </View>
            </View>
          </View>
<<<<<<< HEAD
        </View>
      </View>
    </>
=======

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
                  ride.payment_status === "paid"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {ride.payment_status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
>>>>>>> origin/AsherUpdate2
  );
};

export default Riderscreen;
