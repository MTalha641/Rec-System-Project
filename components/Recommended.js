import { FlatList, View } from 'react-native';
import React, { useState } from 'react';
import ProductCard from './ProductCard'; // Import the ProductCard component
import * as Animatable from 'react-native-animatable'

const zoomIn = {
  0: {
    scale: 0.9
  },

  1: {
    scale: 1
  }
}

const zoomOut = {
  0: {
    scale: 1
  },

  1: {
    scale: 0.9
  }
}

const TrendingItem = ({activeItem, item}) => {
  return (
    <Animatable.View
      animation={activeItem === item.productID ? zoomIn : zoomOut }
      style={{ width: 150 }}
    >
      <ProductCard product={item} />
    </Animatable.View> 
  );
}

const Recommended = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[1]);

  // Slice the posts array to show only 7 items
  const limitedPosts = posts.slice(0, 7);

  return (
    <View className="flex-row items-center justify-center border-black-200 w-full">
      <FlatList
        data={limitedPosts} // Pass the sliced posts array
        keyExtractor={(item) => item.productID} // Use productID as key
        renderItem={({ item }) => (
          <TrendingItem activeItem={activeItem} item={item} />
        )}
        horizontal // Makes the FlatList horizontal
        showsHorizontalScrollIndicator={false} // Hides the scroll indicator
      />
    </View>
  );
};

export default Recommended;
