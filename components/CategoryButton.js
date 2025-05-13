import React from "react";
import { TouchableOpacity, Text, View } from "react-native";

const CategoryButton = ({ IconComponent, IconName, categoryValue, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-black-100 rounded-xl px-3 py-2 items-center justify-center"
      style={{
        width: 90,
        marginRight: 8,
      }}
    >
      {IconComponent ? (
        <IconComponent color="white" size={24} />
      ) : (
        <View style={{ width: 24, height: 24 }} />
      )}
      <Text
        className="text-xs text-white text-center mt-1"
        numberOfLines={2}
        style={{
          lineHeight: 16,
        }}
      >
        {IconName}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryButton;
