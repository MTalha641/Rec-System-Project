import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { router } from "expo-router";

const CategoryButton = ({ Icon, IconName, Upload }) => {
  return (
    <TouchableOpacity
      style={{ marginRight: 8 }}
      onPress={() => {
        if (Upload) {
          // Upload logic if needed
        } else {
          router.push({
            pathname: "/category/[categoryName]",
            params: { categoryName: IconName },
          });
        }
      }}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            height: 65,
            width: 65,
            borderRadius: 999,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F4F4F4",
            marginBottom: 10,
          }}
        >
          <Image source={Icon} style={{ height: 40, width: 40 }} />
        </View>
        <Text className="text-gray-100" style={{ textAlign: "center", fontSize: 14, fontWeight: "500" }}>
          {IconName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryButton;
