import React from "react";
import { TouchableOpacity, Text, Image, View } from "react-native";

const CategoryButton = ({ Icon, IconName, navigation }) => {
  return (
    <TouchableOpacity
      style={{
        alignItems: "center",
        marginHorizontal: 8,
        backgroundColor: "#1e1e1e",
        padding: 10,
        borderRadius: 8,
      }}
      onPress={() =>
        navigation?.navigate("CategoryItems", { category: IconName })
      } // Ensure navigation exists
    >
      <Image
        source={Icon}
        style={{ width: 40, height: 40 }}
        resizeMode="contain"
      />
      <Text
        style={{
          marginTop: 8,
          color: "white",
          fontSize: 12,
          textAlign: "center",
        }}
      >
        {IconName || "Default Category"} {/* Provide a fallback name */}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryButton;
