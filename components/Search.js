import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from "react-native";
import React from "react";
import { router } from "expo-router";

import icon1 from "../assets/icons/search.png";

const Search = () => {
  return (
    <View className="w-full border-2 border-black-200 px-4 border-black-200 h-16 bg-black-100 rounded-2xl items-center focus:border-secondary flex-row space-x-4">
      <TouchableOpacity
        onPress={() => {
          // Navigate to /search/query
          router.push("/search/query");
        }}
        className="flex-1 flex-row items-center justify-between"
      >
        <Text
          className="text-base mt-0.5 flex-1 text-white font-pregular"
          style={{ opacity: 0.6 }}
        >
          Search for an Item
        </Text>
        <Image source={icon1} className="w-5 h-5" resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

export default Search;
