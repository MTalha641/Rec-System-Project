import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { API_URL } from "@env";

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

  const productImage = product.image;
  const fullImageUrl = productImage?.startsWith('http')
    ? productImage
    : `${API_URL}${productImage}`;

  return (
    <View
      className="bg-black-100 rounded-2xl shadow-lg my-1 overflow-hidden"
      style={{
        borderRadius: 10,
        marginBottom: 2,
        width: "100%",
        height: 200,
      }}
    >
      <Pressable onPress={handlePress} style={{ flex: 1 }}>
        {productImage ? (
          <Image
            source={{ uri: fullImageUrl }}
            className="w-full"
            resizeMode="cover"
            style={{
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              height: 120,
              width: "100%",
            }}
          />
        ) : (
          <View
            style={{
              height: 120,
              backgroundColor: "#e0e0e0",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="text-center text-gray-500">No Image</Text>
          </View>
        )}

        <View className="px-4 pt-2">
          <Text className="font-bold text-white text-sm truncate" numberOfLines={1}>
            {product.title}
          </Text>

          <Text className="text-blue-600 text-sm truncate">
            PKR {product.price}
            <Text className="text-white"> /day</Text>
          </Text>

          <View className="flex-row justify-start items-center mt-1">
            <MaterialIcons name="category" size={16} color="#777777" />
            <Text
              className="text-xs text-white ml-1 truncate"
              numberOfLines={1}
            >
              {product.category} • {product.sub_category}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default ProductCard;
