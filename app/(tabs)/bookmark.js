import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const Bookmark = () => {
  const [selectedTab, setSelectedTab] = useState('requested');
  const router = useRouter();

  // Dummy data for bookmarks
  const bookmarks = [
    { id: '1', title: 'Laptop', category: 'Electronics', imageUrl: 'https://via.placeholder.com/150', status: 'pending' },
    { id: '2', title: 'Sofa Set', category: 'Furniture', imageUrl: 'https://via.placeholder.com/150', status: 'accepted' },
    { id: '3', title: 'Python Book', category: 'Books', imageUrl: 'https://via.placeholder.com/150', status: 'pending' },
    { id: '4', title: 'Leather Jacket', category: 'Clothing', imageUrl: 'https://via.placeholder.com/150', status: 'accepted' },
    { id: '5', title: 'Smartphone', category: 'Electronics', imageUrl: 'https://via.placeholder.com/150', status: 'pending' },
    { id: '6', title: 'Dining Table', category: 'Furniture', imageUrl: 'https://via.placeholder.com/150', status: 'accepted' },
    { id: '7', title: 'Gaming Console', category: 'Electronics', imageUrl: 'https://via.placeholder.com/150', status: 'pending' },
    { id: '8', title: 'T-shirt Pack', category: 'Clothing', imageUrl: 'https://via.placeholder.com/150', status: 'accepted' },
  ];

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 p-5 bg-[#161622]">
        <View className="flex-row justify-center">
          <TouchableOpacity onPress={() => setSelectedTab('requested')} className={`p-2 ${selectedTab === 'requested' ? 'border-b-2 border-blue-500' : ''}`}>
            <Text className="text-lg font-semibold text-white">Requested</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTab('approved')} className={`p-2 ${selectedTab === 'approved' ? 'border-b-2 border-blue-500' : ''}`}>
            <Text className="text-lg font-semibold text-white">Approved</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="mt-4">
          {bookmarks.filter(item => (selectedTab === 'requested' ? item.status !== 'accepted' : item.status === 'accepted')).length === 0 ? (
            <Text className="text-center text-white mt-4">No bookmarks found</Text>
          ) : (
            bookmarks.filter(item => (selectedTab === 'requested' ? item.status !== 'accepted' : item.status === 'accepted')).map((item) => (
              <View key={item.id} className="bg-[#1E1E2D] rounded-lg p-4 mb-4 shadow-md">
                <View className="flex-row items-center">
                  <Image source={{ uri: item.imageUrl }} className="w-16 h-16 rounded-lg mr-4" />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">{item.title}</Text>
                    <Text className="text-white">{item.category}</Text>
                  </View>
                </View>
                {selectedTab === 'requested' && (
                  <TouchableOpacity className="mt-2 bg-red-500 p-2 rounded-lg" onPress={() => console.log('Cancel request', item.id)}>
                    <Text className="text-white text-center">Cancel Request</Text>
                  </TouchableOpacity>
                )}
                {selectedTab === 'approved' && (
                  <TouchableOpacity className="mt-2 bg-green-500 p-2 rounded-lg" onPress={() => router.push('Riderscreen')}>
                    <Text className="text-white text-center">Initiate Delivery</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Bookmark;
