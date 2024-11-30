import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const ProductCard = ({ product }) => {
  const router = useRouter(); // Initialize router

  const handlePress = () => {
    // Navigate to ProductDetails and pass product data as query parameters
    router.push({
      pathname: "/ProductDetails",
      params: { product },
    });
  };

  // Check if product is undefined or not populated
  if (!product) {
    return (
      <Text className="text-center font-bold text-2xl pt-12">
        Coming Soon
      </Text>
    );
  }

  // Check if imageids is available and has at least one image
  const productImage = product.imageids?.[0]?.uri; // Correctly access the `uri` property

  return (
    <View
      className="bg-white rounded-2xl shadow-lg my-1 bg-black-100"
      style={{
        borderRadius: 10,
        marginBottom: 2,
        width: "100%",
        height: 200,
      }}
    >
      {/* Product Image */}
      <Pressable onPress={handlePress}>
        {productImage ? (
          <Image
            source={{ uri: productImage }} // Ensure it's a valid URI
            className="w-full"
            resizeMode="cover"
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              height: 120,
            }}
          />
        ) : (
          <View
            style={{
              height: 120,
              backgroundColor: "#e0e0e0",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            {/* Placeholder for missing image */}
            <Text className="text-center text-gray-500">No Image</Text>
          </View>
        )}
        <View className="px-4 pt-1">
          {/* Product Title */}
          <Text className="font-bold text-white text-sm truncate" numberOfLines={1}>
            {product.title}
          </Text>

          {/* Product Price */}
          <Text className="text-blue-600 text-sm truncate">
            PKR {product.price}
            <Text className="text-white"> /day</Text>
          </Text>

          {/* Category */}
          <View className="flex-row justify-start items-center mt-1">
            <MaterialIcons name="category" size={16} color="#777777" />
            <Text className="text-xs truncate text-white ml-1">
              {product.category}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ProductCard;
