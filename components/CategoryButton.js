
import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";

const CategoryButton = ({ Icon, IconName, Upload, navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <TouchableOpacity
      style={{ marginRight: 8 }}
      onPress={() => {
        setSelectedCategory(IconName);
        if (Upload) {
          // Handle upload functionality if needed
        } else {
          navigation.navigate("CategoriesProduct", {
            category: IconName, // Passing the category name to the next screen
          });
        }
      }}
    >
      {/* Wrap the icon and text in a single View to align them vertically */}
      <View style={{ alignItems: "center" }}> 
        <View
          style={{
            height: 65,
            width: 65,
            borderRadius: 999,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F4F4F4",
            marginBottom: 10, // Added to create space between icon and text
          }}
        >
          {/* Display the icon using Image component */}
          <Image source={Icon} style={{ height: 40, width: 40 }} />
        </View>
        <Text 
          style={{ 

            textAlign: "center", 
            fontSize: 14, 
            fontWeight: "500"  // Added font weight for emphasis
          }}
          className= "text-gray-100"
        >
          {IconName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryButton;
