import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
} from "react-native";
import axios from "axios";
import { API_URL } from '@env';
import { AuthContext } from "../app/context/AuthContext";

import icon1 from "../assets/icons/search.png";

const Search = () => {
  const { token } = useContext(AuthContext); // Access the token from AuthContext
  const [query, setQuery] = useState(""); // Track the search query
  const [results, setResults] = useState([]); // Store search results
  const [loading, setLoading] = useState(false); // Show loading state

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/api/items/search?q=${text}`,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in headers
          },
        }
      );

      setResults(response.data.search_results);
    } catch (error) {
      console.error("Error fetching search results:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      className="p-4 bg-black-200 mb-2 rounded-lg"
      onPress={() => {
        // Navigate to item details page or handle item selection
        console.log("Navigate to item:", item.title);
      }}
    >
      <Text className="text-white font-bold">{item.title}</Text>
      <Text className="text-gray-400">{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black-100 px-4 py-6">
      {/* Search Input */}
      <View className="w-full h-16 bg-black-200 rounded-xl flex-row items-center px-4">
        <TextInput
          className="flex-1 text-white font-pregular"
          style={{ opacity: 0.9 }}
          placeholder="Search for an Item"
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={query}
          onChangeText={handleSearch}
        />
        <Image source={icon1} className="w-5 h-5 ml-2" resizeMode="contain" />
      </View>

      {/* Search Results */}
      {loading ? (
        <Text className="text-white mt-4">Loading...</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderResultItem}
          contentContainerStyle={{ marginTop: 20 }}
        />
      )}
    </View>
  );
};

export default Search;
