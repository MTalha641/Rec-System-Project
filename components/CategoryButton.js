import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

const CategoryButton = ({ IconComponent, IconName, Upload, categoryValue, isSelected, onPress }) => {
  const handlePress = () => {
    if (Upload) {
      // Upload logic if needed
    } else if (onPress) {
      // Use custom press handler if provided
      onPress();
    } else {
      // Default navigation behavior
      router.push({
        pathname: "/category/[categoryName]",
        params: { categoryName: categoryValue || IconName },
      });
    }
  };

  return (
    <TouchableOpacity
      style={{ marginRight: 8 }}
      onPress={handlePress}
    >
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            height: 65,
            width: 65,
            borderRadius: 999,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isSelected ? "#6366f1" : "#F4F4F4",
            marginBottom: 10,
            borderWidth: isSelected ? 2 : 0,
            borderColor: "#a5b4fc",
          }}
        >
          {IconComponent && (
            <IconComponent 
              size={32}
              color={isSelected ? "#ffffff" : "#333333"}
            />
          )}
        </View>
        <Text 
          className={`${isSelected ? "text-secondary" : "text-gray-100"}`} 
          style={{ textAlign: "center", fontSize: 14, fontWeight: "500" }}
        >
          {IconName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryButton;
