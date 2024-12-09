import React from "react";
import { View, Text, FlatList } from "react-native";
import CategoryButton from "./CategoryButton"; // Assuming the file is in the same directory

// Importing your furniture icon for now
import Furniture from '../assets/icons/living-room.png'; // Assuming you're using a .png icon

const ShowCategories = ({ navigation }) => {
  // Array of categories with names and using the Furniture icon for all categories temporarily
  const categories = [
    { name: "Tools", icon: Furniture },
    { name: "Equipment", icon: Furniture },
    { name: "Appliances", icon: Furniture },
    { name: "Apparel", icon: Furniture },
    { name: "Footwear", icon: Furniture },
    { name: "Kitchenware", icon: Furniture },
    { name: "Furniture", icon: Furniture },
    { name: "Computing", icon: Furniture },
    { name: "Others", icon: Furniture },
  ];

  return (
    <View className = "mt-4">
      
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <CategoryButton
            Icon={item.icon}
            IconName={item.name}
            navigation={navigation} // Pass navigation to CategoryButton for navigation logic
          />
        )}
      />
    </View>
  );
};

export default ShowCategories;