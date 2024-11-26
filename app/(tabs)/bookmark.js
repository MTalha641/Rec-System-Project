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
import moment from "moment";

const bookmark = () => {
  const [handleModal, setHandleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  // Dummy Data
  const dummyProducts = [
    {
      requestId: "1",
      product: {
        productID: "100",
        image: "https://via.placeholder.com/80",
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
        image: "https://via.placeholder.com/80",
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
        image: "https://via.placeholder.com/80",
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
      requestId: "4",
      product: {
        productID: "103",
        image: "https://via.placeholder.com/80",
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
      requestId: "5",
      product: {
        productID: "104",
        image: "https://via.placeholder.com/80",
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
      requestId: "6",
      product: {
        productID: "105",
        image: "https://via.placeholder.com/80",
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
      requestId: "7",
      product: {
        productID: "106",
        image: "https://via.placeholder.com/80",
        title: "Wireless Headphones",
        category: "Electronics",
        email: "seller@example.com",
      },
      timeStamp: "2024-11-20T12:00:00Z",
      totalPrice: 5000,
      requestStatus: "pending",
      endDate: "2024-11-25",
    },
  ];

  const handleCloseModal = () => setHandleModal(false);

  const Card = ({
    id,
    image,
    title,
    time,
    price,
    category,
    status,
    email,
    endDate,
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case "accept":
          return "#28a745"; // green
        case "reject":
          return "#dc3545"; // red
        case "pending":
          return "#ffc107"; // yellow
        default:
          return "#888888"; // gray
      }
    };

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
        <Image source={{ uri: image }} resizeMode="contain" style={styles.image} />
        <View style={styles.content}>
          <View style={styles.titleTimeContainer}>
            <Text style={styles.title}>
              {title.slice(0, 13)}
              {title.length > 13 && "..."}
            </Text>
            <Text style={styles.time}>{moment(time).format("MMMM Do YYYY, h:mm a")}</Text>
          </View>
          <Text style={styles.price}>PKR {price}</Text>
          <Text style={styles.category}>{email}</Text>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.titleTimeContainer}>
            <View
              style={[styles.status, { backgroundColor: getStatusColor() }]}
            >
              <Text style={styles.statusText}>
                {status === "pending" ? status : status + "ed"}
              </Text>
            </View>
            {isEndDateToday && status !== "pending" && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  setSelectedId(id);
                  setHandleModal(true);
                }}
              >
                <Text style={styles.cancelButtonText}>Give Review</Text>
              </TouchableOpacity>
            )}
            {status === "pending" && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                {isLoading ? (
                  <ActivityIndicator size={"small"} color="#FFFFFF" />
                ) : (
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {dummyProducts.length > 0 ? (
          dummyProducts.map((item) => (
            <Card
              key={item.requestId}
              id={item.product.productID}
              image={item.product.image}
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
    backgroundColor: "#161622"
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    color: "#CDCDE0"
  },
  titleTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#CDCDE0"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#CDCDE0"
  },
  time: {
    fontSize: 12,
    color: "#CDCDE0",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#CDCDE0"
  },
  category: {
    color: "#CDCDE0",
    marginBottom: 4,
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  cancelButton: {
    backgroundColor: "#FF0000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  reviewButton: {
    backgroundColor: "blue",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
});

export default bookmark;
