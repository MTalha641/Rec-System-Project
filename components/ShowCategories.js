import React from "react";
import { View, FlatList } from "react-native";
import CategoryButton from "./CategoryButton";
import Furniture from '../assets/icons/living-room.png';

const ShowCategories = () => {
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
    <View className="mt-4">
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <CategoryButton Icon={item.icon} IconName={item.name} />
        )}
      />
    </View>
  );
};

export default ShowCategories;
