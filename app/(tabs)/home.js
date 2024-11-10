import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import React, { useState, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import logo from '../../assets/images/RLogo.png';
import Search from '../../components/Search';
import Recommended from '../../components/Recommended';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import { products } from '../../components/ProductData';
import { AuthContext } from "../context/AuthContext"; 

const Home = () => {
  const { user } = useContext(AuthContext); // Access user from AuthContext
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Recall Ads/Items or any data fetching logic
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
            <View className="justify-content items-start flex-row mb-6">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">
                  Welcome Back!
                </Text>
                <Text className="text-2xl font-psemibold text-white">
                  {user ? user.username : 'User'} {}
                </Text>
              </View>
              <View>
                <Image
                  source={logo}
                  className="w-[400px] h-[60px]"
                  resizeMode="contain"
                />
              </View>
            </View>

            <Search />

            <View className="w-full flex-1 pt-5 pb-4">
              <Text className="text-gray-100 text-lg font-pregular mb-3">
                Recommended Items
              </Text>

              <Recommended posts={products} />
            </View>
            <Text className="text-gray-100 text-lg font-pregular mb-1">
              Explore Items
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState title="No Items Found" />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
