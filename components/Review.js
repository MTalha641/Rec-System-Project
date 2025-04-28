// import React, { useEffect, useState } from "react";
// import { FlatList, Text, View, StyleSheet } from "react-native";
// import Ratings from "./Ratings";
// import axios from "axios";
// import { API_URL } from "@env";

// const Reviews = () => {
//   const [reviewData, setReviewData] = useState([]);

//   useEffect(() => {
//     const fetchReviews = async () => {
//       try {
//         const response = await axios.get(`${API_URL}/api/reviews/getreview/${itemId}/`);
//         setReviewData(response.data);
//       } catch (error) {
//         console.error("Error fetching reviews:", error);
//       }
//     };

//     fetchReviews();
//   }, []);

//   const renderItem = ({ item }) => (
//     <View style={styles.reviewContainer}>
//       <Ratings value={item.rating} />
//       <Text style={styles.commentText}>{item.comment}</Text>
//     </View>
//   );

//   return reviewData.length > 0 ? (
//     <FlatList
//       data={reviewData}
//       renderItem={renderItem}
//       horizontal
//       keyExtractor={(item, index) => index.toString()}
//       showsHorizontalScrollIndicator={false}
//     />
//   ) : (
//     <Text style={styles.noReviewsText}>No Reviews</Text>
//   );
// };

// const styles = StyleSheet.create({
//   reviewContainer: {
//     backgroundColor: "#1E1E2D",
//     padding: 10,
//     maxWidth: 300,
//     marginRight: 10,
//     borderRadius: 10,
//     marginBottom: 20,
//   },
//   commentText: {
//     marginTop: 5,
//     color: "white",
//   },
//   noReviewsText: {
//     alignSelf: "center",
//     fontSize: 16,
//     color: "white",
//   },
// });

// export default Reviews;
