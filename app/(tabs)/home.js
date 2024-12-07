import { View, Text, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios'; // Import axios

import logo from '../../assets/images/RLogo.png';
import Search from '../../components/Search';
import Recommended from '../../components/Recommended'; // Recommended fetches its own data
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ShowCategories from '../../components/ShowCategories';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '@env';

const Home = () => {
  const { user, token } = useContext(AuthContext); // Use token from AuthContext
  const [refreshing, setRefreshing] = useState(false);
  const [exploreItems, setExploreItems] = useState([]); // State to hold fetched items
  const [loading, setLoading] = useState(false); // To show a loading indicator

  // Fetch items from API
  const fetchExploreItems = async () => {
    if (!token) {
      console.warn('No token available!');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`${API_URL}/api/items/excludemyitems/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data) {
        setExploreItems(response.data);
      } else {
        console.warn('No data received from the API');
      }
    } catch (error) {
      console.error('Error fetching explore items:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchExploreItems();
    } else {
      console.warn('No token available to fetch explore items.');
    }
  }, [token]); // Re-fetch if token changes

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExploreItems(); // Re-fetch items
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={exploreItems} // Use exploreItems for FlatList data
        keyExtractor={(item) =>
          item.productID
            ? item.productID.toString()
            : item.id?.toString() || item.title?.toString() || Math.random().toString()
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 / 2, padding: 10 }}>
            <ProductCard product={item} />
          </View>
        )}
        numColumns={2}
        contentContainerStyle={{
          paddingHorizontal: 10,
        }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
        }}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 space-y-6">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="font-pmedium text-sm text-gray-100">Welcome!</Text>
                <Text
                  className="text-2xl font-psemibold text-white"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user ? user.username : 'User'}
                </Text>
              </View>
              <Image
                source={logo}
                className="h-[65px]"
                style={{ width: 100 }} // Fixed width for the logo
                resizeMode="contain"
              />
            </View>

            <Search />

            <View className="w-full">
              <Text className="text-lg font-pregular mb-1" style={{color: "#ffffff"}}>Categories</Text>
              <ShowCategories />
            </View>

            <View className="w-full flex-1 pt-2 pb-4">
              <Text className="text-lg font-pregular mb-3" style={{color: "#ffffff"}}>Recommended Items</Text>
              <Recommended /> {/* No props passed here */}
            </View>

            <Text className="text-lg font-pregular mb-1" style={{color: "#ffffff"}}>Explore Items</Text>
          </View>
        )}
        ListEmptyComponent={() =>
          !loading ? <EmptyState title="No Items Found" /> : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={() =>
          loading && (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
          )
        }
      />
    </SafeAreaView>
  );
};

export default Home;
