import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ReactNativeModal from "react-native-modal";
import CustomButton from "../components/CustomButton"; // Ensure this component exists
import { Ionicons } from "@expo/vector-icons";
import logo from "../assets/images/RLogo.png"; // Replace with actual path
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductReview = () => {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params;

  const handlePostReview = async () => {
    if (!name.trim() || !review.trim() || rating === 0) {
      setError("All fields are required, including a rating.");
      return;
    }

    try {
      // Fetch existing reviews from storage
      const existingReviews = await AsyncStorage.getItem(
        `reviews_${productId}`
      );
      const reviewsArray = existingReviews ? JSON.parse(existingReviews) : [];

      // Create new review object
      const newReview = { id: Date.now(), review, rating };

      // Save updated reviews
      await AsyncStorage.setItem(
        `reviews_${productId}`,
        JSON.stringify([...reviewsArray, newReview])
      );

      Alert.alert("Success", "Review added!");
      navigation.goBack(); // Go back to Product Details
    } catch (error) {
      console.error("Error saving review:", error);
    }

    setError("");
    setSuccess(true);
    setTimeout(() => router.push("/home"), 2000); // Redirect after 2 seconds
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Review</Text>
      </View>

      <ScrollView className="p-5">
        <Text className="text-white text-2xl font-bold mb-4">
          Leave a Review
        </Text>

        {error ? (
          <Text className="text-red-500 font-bold  mb-3">{error}</Text>
        ) : null}

        <Text className="text-white text-lg mb-2 font-bold">Your Name</Text>
        <TextInput
          className="font-bold border border-gray-400 rounded-lg p-3 text-white"
          placeholder="Enter your name"
          placeholderTextColor="white"
          value={name}
          onChangeText={setName}
        />

        <Text className="text-white text-lg mt-4 mb-2 font-bold">Rating</Text>
        <View className="flex-row border border-gray-400 rounded-lg p-3 text-white">
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text
                className={`text-3xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-400"
                }`}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-white text-lg mt-4 mb-2 font-bold">
          Your Review
        </Text>
        <TextInput
          className="border border-gray-400 rounded-lg p-3 text-white h-32"
          placeholder="Write your review here..."
          placeholderTextColor="white"
          multiline
          value={review}
          onChangeText={setReview}
        />

        <CustomButton
          title="Post Review"
          containerStyles="mt-5 font-bold"
          handlePress={handlePostReview}
        />
      </ScrollView>

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => {
          setSuccess(false);
          router.push("/home");
        }}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">
            Product Review posted successfully.
          </Text>
          <Text className="text-md text-gray-500 text-center mt-3">
            Thank you for your review. Your review will help us become better.
            Please proceed.
          </Text>
          <CustomButton
            title="Back Home"
            containerStyles="mt-5 w-full"
            handlePress={() => {
              setSuccess(false);
              router.push("/home");
            }}
          />
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
});

export default ProductReview;
