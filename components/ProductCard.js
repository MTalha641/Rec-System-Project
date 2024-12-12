import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

const ProductCard = ({ product }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/ProductDetails",
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
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ProductCard;
