import React, { useEffect, useState , useContext} from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import Ratings from "./Ratings";
import axios from "axios";
import { API_URL } from "@env";
import { AuthContext } from "../context/AuthContext";

const Reviews = ({ id }) => {
  const { token } = useContext(AuthContext);// Get token from context
  const [reviewData, setReviewData] = useState([]);
  // console.log("Review component received id:", id);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return; // Ensure id and token are available

      try {
        const response = await axios.get(`${API_URL}/api/reviews/getreview/${id}/`, {
          headers: {
            Authorization: `Bearer ${token}`, // Add token in headers
          },
        });
        console.log("here")
        setReviewData(response.data);
        console.log("Fetched Reviews for ID:", id, response.data);

        console.log("component inside")
      } catch (error) {
        console.error("Error fetching reviews:", error.response?.data || error.message);
      }
    };

    fetchReviews();
  }, [id, token]); // Re-run when id or token changes

  const renderItem = ({ item }) => (
    <View style={styles.reviewContainer}>
      <Ratings value={item.rating} />
      <Text style={styles.commentText}>{item.review}</Text>
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
    backgroundColor: "#1E1E2D",
    padding: 10,
    maxWidth: 300,
    marginRight: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  commentText: {
    marginTop: 5,
    color: "white",
  },
  noReviewsText: {
    alignSelf: "center",
    fontSize: 16,
    color: "white",
  },
});

export default Reviews;
