import React, { useEffect, useState } from "react";
import { FlatList, Text, View, Dimensions, StyleSheet } from "react-native";

import { FontAwesome } from "@expo/vector-icons"; // Expo-compatible icons
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen width for dynamic sizing
const { width } = Dimensions.get("window");

const Review = () => {
  const [reviewData, setReviewData] = useState([]);

  // Mock data for reviews
  const reviews = [
    {
      name: "Sumair Ahmed",
      rating: 5,
      comment:
        "Overall good experience, shoe is comfy and well-maintained. I saved good amount of money and still stand out in my event.",
    },
    {
      name: "Zulfiqar Ahmed Khan",
      rating: 3,
      comment:
        "Cards are a great way to display information, usually containing content and actions about a single subject. Cards can contain images, buttons, text and more.",
    },
    {
      name: "Abdur Rehman",
      rating: 5,
      comment:
        "Cards are a great way to display information, usually containing content and actions about a single subject. Cards can contain images, buttons, text and more.",
    },
    {
      name: "Hassaan Quershi",
      rating: 4.5,
      comment:
        "Cards are a great way to display information, usually containing content and actions about a single subject. Cards can contain images, buttons, text and more.",
    },
  ];

  useEffect(() => {
    // Simulating fetching data by using mock data
    setReviewData(reviews);
  }, []);

  const renderItem = (data) => {
    return (
      <View
        style={styles.reviewContainer}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.avatarContainer}>
            <FontAwesome
              name="user-circle"
              size={40}
              color="gray"
            />
          </View>
          <View style={styles.reviewDetails}>
            <Text style={styles.reviewName}>{data.item.name}</Text>
            <View style={styles.ratingContainer}>
              {/* Render Star Ratings */}
              {[...Array(5)].map((_, index) => (
                <FontAwesome
                  key={index}
                  name={data.item.rating >= index + 1 ? "star" : "star-o"}
                  size={14}
                  color="#EC8932"
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.reviewComment}>{data.item.comment}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: 15}}>

      {reviewData?.length > 0 ? (
        <FlatList
          data={reviewData}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <Text style={styles.noReviewsText}>
          No Reviews Yet
        </Text>
      )}
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  reviewContainer: {
    backgroundColor: "#1E1E2D",
    padding: 10,
    maxWidth: width * 0.8, // Limited width
    marginRight: 10,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 10,
  },
  reviewDetails: {
    flexDirection: "column",
  },
  reviewName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#CDCDE0",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewComment: {
    marginTop: 5,
    color: "#CDCDE0",
    fontSize: 14,
  },
  heading: {
    fontSize: 18,
 fontWeight: "bold",
    color: "#CDCDE0",
  },
  noReviewsText: {
    alignSelf: "center",
    color: "#CDCDE0",
    fontSize: 14,
  },
});

export default Review;
