import React, { useContext, useState } from 'react';
import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import logo from '../../assets/images/RLogo.png';
import electronic from '../../assets/images/electronic.jpg';
import furniture from '../../assets/images/furniture.jpg';
import books from '../../assets/images/books.jpg';

import Search from '../../components/Search';
import Recommended from '../../components/Recommended';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ShowCategories from '../../components/ShowCategories';
import { products } from '../../components/ProductData';
import { AuthContext } from '../context/AuthContext'; // Assuming you have AuthContext set up

const Home = () => {
  const { user } = useContext(AuthContext); // Fetch user details from AuthContext
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add your data fetching or refreshing logic here
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={products} // Pass product data to FlatList
        keyExtractor={(item) => item.productID} // Use the correct key
        renderItem={({ item }) => (
          // Render the ProductCard component for each item in the list
          <View style={{ flex: 1 / 2, padding: 10 }}>
            <ProductCard product={item} />
          </View>
        )}
        // Enable 2-column layout for row-wise rendering
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10 }} // Padding for the container
        columnWrapperStyle={{ justifyContent: 'space-between' }} // Ensure equal spacing between columns
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            {/* Welcome Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View style={{ flex: 1 }}>
                <Text className="font-pmedium text-sm text-gray-100">
                  Welcome Back!
                </Text>
                <Text
                  className="text-2xl font-psemibold text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ maxWidth: '80%' }} // Restrict username width to avoid overlap
                >
                  {user?.username || 'Guest'}
                </Text>
              </View>
              <Image
                source={logo}
                className="h-[65px]"
                style={{ width: 100 }} // Fixed width for the logo
                resizeMode="contain"
              />
            </View>

            {/* Search Bar */}
            <Search />

            {/* Categories Section */}
            <View className="w-full">
              <Text className="text-gray-100 text-lg font-pregular mb-1">
                Categories
              </Text>
              <ShowCategories />
            </View>

            {/* Recommended Items Section */}
            <View className="w-full flex-1 pt-2 pb-4">
              <Text className="text-gray-100 text-lg font-pregular mb-3">
                Recommended Items
              </Text>
              <Recommended posts={products} />
            </View>

            {/* Explore Items Header */}
            <Text className="text-gray-100 text-lg font-pregular mb-1">
              Explore Items
            </Text>
          </View>
        )}
        ListEmptyComponent={() => <EmptyState title="No Items Found" />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
