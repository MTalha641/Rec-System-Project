import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";
import logo from "../assets/images/RLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const MyProductsList = () => {
  const [selectedTab, setSelectedTab] = useState("reservation");

  const dummyProducts = [
    {
      requestId: "1",
      product: { title: "Wireless Headphones", category: "Electronics" },
      timeStamp: "2024-11-20T12:00:00Z",
      totalPrice: 5000,
      requestStatus: "pending",
      endDate: "2024-11-25",
    },
    {
      requestId: "2",
      product: { title: "Running Shoes", category: "Sports" },
      timeStamp: "2024-11-18T10:00:00Z",
      totalPrice: 8000,
      requestStatus: "accept",
      endDate: "2024-11-24",
    },
    {
      requestId: "3",
      product: { title: "Gaming Laptop", category: "Electronics" },
      timeStamp: "2024-11-15T09:30:00Z",
      totalPrice: 150000,
      requestStatus: "accept",
      endDate: "2024-11-28",
    },
    {
      requestId: "4",
      product: { title: "Mountain Bike", category: "Sports" },
      timeStamp: "2024-11-14T16:45:00Z",
      totalPrice: 30000,
      requestStatus: "pending",
      endDate: "2024-12-01",
    },
  ];

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

        <ScrollView className="mt-4">
          {dummyProducts.filter((item) =>
            selectedTab === "reservation"
              ? item.requestStatus !== "accept"
              : item.requestStatus === "accept"
          ).length === 0 ? (
            <Text className="text-center text-white mt-4">
              No products found
            </Text>
          ) : (
            dummyProducts
              .filter((item) =>
                selectedTab === "reservation"
                  ? item.requestStatus !== "accept"
                  : item.requestStatus === "accept"
              )
              .map((item) => (
                <View
                  key={item.requestId}
                  className="bg-[#1E1E2D] rounded-lg p-4 mb-4 shadow-md"
                >
                  <View className="flex-row items-center">
                    <Image
                      source={logo}
                      className="w-16 h-16 rounded-lg mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-white">
                        {item.product.title}
                      </Text>
                      <Text className="text-white">
                        {item.product.category}
                      </Text>
                    </View>
                  </View>
                  {selectedTab === "reservation" && (
                    <TouchableOpacity
                      className="mt-2 bg-green-500 p-2 rounded-lg"
                      onPress={() =>
                        console.log("Cancel reservation", item.requestId)
                      }
                    >
                      <Text className="text-white text-center">
                        {item.product.category}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {selectedTab === "completed" && (
                    <TouchableOpacity
                      className="mt-2 bg-red-500 p-2 rounded-lg"
                      onPress={() =>
                        console.log("Leave Review", item.requestId)
                      }
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
