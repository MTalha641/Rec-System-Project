import React, { useEffect, useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import Ratings from "./Ratings";

const Reviews = () => {
  const [reviewData, setReviewData] = useState([]);

  // Dummy data, as the frontend-only version won't fetch data from the server
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
    setReviewData(reviews); // Directly set reviewData to our dummy data
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.reviewContainer}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name.slice(0, 1)}</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{item.name}</Text>
        <Ratings value={item.rating} />
      </View>
      <Text style={styles.commentText}>{item.comment}</Text>
    </View>
  );

  return reviewData.length > 0 ? (
    <FlatList
      data={reviewData}
      renderItem={renderItem}
      horizontal
      keyExtractor={(item, index) => index.toString()}
      showsHorizontalScrollIndicator={false}
    />
  ) : (
    <Text style={styles.noReviewsText}>No Reviews</Text>
  );
};

const styles = StyleSheet.create({
  reviewContainer: {
    backgroundColor: "white",
    padding: 10,
    maxWidth: 300,
    marginRight: 10,
    borderRadius: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoContainer: {
    marginLeft: 8,
    flexDirection: "column",
  },
  nameText: {
    fontSize: 16,
  },
  commentText: {
    marginTop: 5,
  },
  noReviewsText: {
    alignSelf: "center",
    fontSize: 16,
    color: "grey",
  },
});

export default Reviews;