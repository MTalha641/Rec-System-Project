import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';

import logo from '../../assets/images/RLogo.png';
import Search from '../../components/Search';
import Recommended from '../../components/Recommended';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ShowCategories from '../../components/ShowCategories';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '@env';

const Home = () => {
  const { user, token } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);
  const [exploreItems, setExploreItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dummy notification array — replace with API logic if needed
  const [notifications, setNotifications] = useState([
    { id: 1, type: "approval" },
    { id: 2, type: "request" },
    { id: 3, type: "completion" },
  ]);

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

  useEffect(() => {
    if (token) {
      fetchExploreItems();
    }
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExploreItems();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={exploreItems}
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
              {/* Welcome text and bell grouped together */}
              <View className="flex-row items-center gap-x-4 flex-1">
                <View>
                  <Text className="font-pmedium text-sm text-gray-100">Welcome!</Text>
                  <Text
                    className="text-2xl font-psemibold text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {user?.username || 'User'}
                  </Text>
                </View>

                {/* Notification Icon with Badge */}
                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  className="ml-1 mt-5 relative"
                >
                  <Bell color="white" size={23} />
                  {notifications.length > 0 && (
                    <View
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full items-center justify-center"
                      style={{ width: 16, height: 16 }}
                    >
                      <Text className="text-white text-[10px] font-bold">
                        {notifications.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Logo aligned to right */}
              <Image
                source={logo}
                className="h-[65px]"
                style={{ width: 100 }}
                resizeMode="contain"
              />
            </View>

            <Search />

            <View className="w-full">
              <Text className="text-lg font-pregular mb-1 text-white">Categories</Text>
              <ShowCategories />
            </View>

            <View className="w-full flex-1 pt-2 pb-4">
              <Text className="text-lg font-pregular mb-3 text-white">Recommended Items</Text>
              <Recommended />
            </View>

            <Text className="text-lg font-pregular mb-1 text-white">Explore Items</Text>
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
