import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import axios from "axios";
import { API_URL } from "@env";
import { AuthContext } from "../context/AuthContext";

const Reviews = ({ id }) => {
  const [reviews, setReviews] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`${API_URL}/api/reviews/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReviews(response.data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, [id, token]);

  const renderReview = ({ item }) => (
    <View style={styles.reviewContainer}>
      <Text style={styles.reviewerName}>{item.user.username}</Text>
      <Text style={styles.reviewText}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  reviewContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
});

export default Reviews;
