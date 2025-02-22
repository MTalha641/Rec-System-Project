import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const ProductCard = ({ product }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: `/product/${product.id}`,
      params: { product },
    });
  };

  if (!product) {
    return (
      <Text className="text-center font-bold text-2xl pt-12">
        Coming Soon
      </Text>
    );
  }

  const productImage = product.image; // Use the full URL from the backend

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
      <Pressable onPress={handlePress}>
        {productImage ? (
          <Image
            source={{ uri: productImage }} // Full URI for the image
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
<<<<<<< HEAD
            <Text style={{ textAlign: "center", color: "#9E9E9E" }}>
              No Image
            </Text>
          </View>
        )}
        <View style={{ padding: 16 }}>
          <Text
            style={{ fontWeight: "bold", color: "#FFFFFF", fontSize: 14 }}
            numberOfLines={1}
          >
            {product.title || "Untitled Product"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Text style={{ color: "#007BFF", fontSize: 12 }}>
              PKR {product.price || "N/A"}
            </Text>
            <Text style={{ color: "#FFFFFF", fontSize: 12 }}> /day</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <MaterialIcons name="category" size={16} color="#777777" />
            <Text style={{ fontSize: 12, color: "#FFFFFF", marginLeft: 4 }}>
              {product.category || "Uncategorized"}
=======
            <Text className="text-center text-gray-500">No Image</Text>
          </View>
        )}
        <View className="px-4 pt-1">
          <Text className="font-bold text-white text-sm truncate" numberOfLines={1}>
            {product.title}
          </Text>
          <Text className="text-blue-600 text-sm truncate">
            PKR {product.price}
            <Text className="text-white"> /day</Text>
          </Text>
          <View className="flex-row justify-start items-center mt-1">
            <MaterialIcons name="category" size={16} color="#777777" />
            <Text className="text-xs truncate text-white ml-1">
              {product.category}
>>>>>>> ec78a19527262ad4e08178b934d5c508a446979a
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ProductCard;
