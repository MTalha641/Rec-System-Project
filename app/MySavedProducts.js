import React, { useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import logo from "../assets/images/RLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const MySavedProducts = () => {
  const navigation = useNavigation();
  const [handleModal, setHandleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const dummyProducts = [
    {
      requestId: "1",
      product: {
        productID: "100",
        title: "Wireless Headphones",
        category: "Electronics",
        email: "seller@example.com",
      },
      timeStamp: "2024-11-20T12:00:00Z",
      totalPrice: 5000,
      requestStatus: "pending",
      endDate: "2024-11-25",
    },
    {
      requestId: "2",
      product: {
        productID: "101",
        title: "Running Shoes Item",
        category: "Sports",
        email: "seller2@example.com",
      },
      timeStamp: "2024-11-18T10:00:00Z",
      totalPrice: 8000,
      requestStatus: "accept",
      endDate: "2024-11-24",
    },
    {
      requestId: "3",
      product: {
        productID: "102",
        title: "Gaming Laptop",
        category: "Electronics",
        email: "techstore@example.com",
      },
      timeStamp: "2024-11-15T09:30:00Z",
      totalPrice: 150000,
      requestStatus: "accept",
      endDate: "2024-11-28",
    },
    {
      requestId: "4",
      product: {
        productID: "103",
        title: "Mountain Bike",
        category: "Sports",
        email: "bikeshop@example.com",
      },
      timeStamp: "2024-11-14T16:45:00Z",
      totalPrice: 30000,
      requestStatus: "pending",
      endDate: "2024-12-01",
    },
    {
      requestId: "5",
      product: {
        productID: "104",
        title: "Smartwatch",
        category: "Electronics",
        email: "gadgethub@example.com",
      },
      timeStamp: "2024-11-10T11:15:00Z",
      totalPrice: 10000,
      requestStatus: "reject",
      endDate: "2024-11-22",
    },
    {
      requestId: "6",
      product: {
        productID: "105",
        title: "Leather Wallet",
        category: "Fashion",
        email: "fashionstore@example.com",
      },
      timeStamp: "2024-11-12T14:20:00Z",
      totalPrice: 2500,
      requestStatus: "accept",
      endDate: "2024-11-20",
    },
    {
      requestId: "7",
      product: {
        productID: "106",
        title: "Office Chair",
        category: "Furniture",
        email: "homestore@example.com",
      },
      timeStamp: "2024-11-08T17:10:00Z",
      totalPrice: 18000,
      requestStatus: "pending",
      endDate: "2024-11-30",
    },
    {
      requestId: "8",
      product: {
        productID: "107",
        title: "Electric Guitar",
        category: "Music",
        email: "musicshop@example.com",
      },
      timeStamp: "2024-11-07T19:55:00Z",
      totalPrice: 40000,
      requestStatus: "accept",
      endDate: "2024-11-25",
    },
    {
      requestId: "9",
      product: {
        productID: "108",
        title: "Camping Tent",
        category: "Outdoor",
        email: "adventuregear@example.com",
      },
      timeStamp: "2024-11-05T08:30:00Z",
      totalPrice: 12000,
      requestStatus: "reject",
      endDate: "2024-11-18",
    },
    {
      requestId: "10",
      product: {
        productID: "109",
        title: "Smartphone",
        category: "Electronics",
        email: "mobileshop@example.com",
      },
      timeStamp: "2024-11-03T13:40:00Z",
      totalPrice: 90000,
      requestStatus: "accept",
      endDate: "2024-11-29",
    },
  ];
  

  const getStatusText = (status) => {
    switch (status) {
      case "accept":
        return "Booked";
      case "pending":
        return "Available";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "accept":
        return "#28a745";
      case "reject":
        return "#dc3545";
      case "pending":
        return "#ffc107";
      default:
        return "#888888";
    }
  };

  const Card = ({ id, title, time, price, category, status, email, endDate }) => {
    const handleCancel = () => {
      setIsLoading(true);
      setTimeout(() => {
        console.log(`Cancelled reservation for ID: ${id}`);
        setIsLoading(false);
      }, 1000);
    };
  
    const isEndDateToday = moment(endDate).isSame(moment(), "day");
  
    return (
      <View style={styles.card}>
        <Image source={logo} resizeMode="contain" style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>{title.slice(0, 25)}{title.length > 25 && "..."}</Text>
          <Text style={styles.time}>{moment(time).format("MMMM Do YYYY, h:mm a")}</Text>
          <Text style={styles.price}>PKR {price}</Text>
          <Text style={styles.time}>{email}</Text>
  
          <View style={styles.bottomRow}>
            <View style={[styles.categoryTag, styles.sportsCategory]}>
              <Text style={styles.statusText}>{category}</Text>
            </View>
            <View style={[styles.status, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusText}>{getStatusText(status)}</Text>
            </View>
          </View>
  
          {isEndDateToday && status !== "pending" && (
            <TouchableOpacity style={styles.reviewButton} onPress={() => { setSelectedId(id); setHandleModal(true); }}>
              <Text style={styles.cancelButtonText}>Give Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Products</Text>
      </View>
      <ScrollView>
        {dummyProducts.length > 0 ? (
          dummyProducts.map((item) => (
            <Card
              key={item.requestId}
              id={item.product.productID}
              title={item.product.title}
              time={item.timeStamp}
              price={item.totalPrice}
              category={item.product.category}
              status={item.requestStatus}
              email={item.product.email}
              endDate={item.endDate}
            />
          ))
        ) : (
          <Text style={{ alignSelf: "center", fontSize: 16 }}>EMPTY</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#FFFFFF"
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#FFFFFF"
  },
  categoryTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    color: "FFFFFF"
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

export default MySavedProducts;
