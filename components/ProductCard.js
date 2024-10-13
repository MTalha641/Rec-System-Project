import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const ProductCard = ({ product }) => {
  if (!product) {
    return (
      <Text className="text-center font-bold text-2xl pt-12">
        Coming Soon
      </Text>
    );
  }

  return (
    <View
      className="bg-white rounded-2xl shadow-lg my-1 bg-black-100"
      style={{
        borderRadius: 10,
        marginBottom: 2,
        width: '100%', // Consistent width for each card in 2-column layout
        height: 200, // Fixed height for each card
      }}
    >
      {/* Product Image */}
      <Pressable onPress={() => alert(`Viewing details for ${product.title}`)}>
        <Image
          source={product.imageids[0]}  // Directly use the local image reference
          className="w-full"
          resizeMode="cover"
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            height: 120, // Fixed height for the image
          }}
        />
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
