import { View, Text, Image } from "react-native";
import React from "react";

import CustomButton from '../components/CustomButton'
import image1 from "../assets/images/empty.png";
import { router } from "expo-router";

const EmptyState = ({ title }) => {
  return (
    <View className="justify-center  items-center text-white px-4">
      <Image
        source={image1}
        resizeMode="contain"
        className="w-[270px] h-[215px]"
      />
      <Text className="text-xl font-psemibold text-white mt-2 text-center">
        {title}
      </Text>
      <CustomButton
      title="Upload Item"
      handlePress={() =>  router.push('/create')}
      containerStyles="w-full my-7"
      />
    </View>
  );
};

export default EmptyState;
