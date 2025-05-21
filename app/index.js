import { Link, Redirect, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../constants";
import logo from "../assets/images/RLogo.png";

import CustomButton from "../components/CustomButton.js"

export default function App() {
  return (
   
    <SafeAreaView className="bg-primary h-full">
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="w-full items-center min-h-[85vh] ">
          <Image
            source={logo}
            className="w-[300px] h-[160px] mt-2"
            resizeMode="contain"
          />

          <Image
            source={images.cards}
            resizeMode="contain"
            className="max-w-[380px] w-full h-[280px]"
          />
          <View className="relative mt-4 ">
            <Text className="text-3xl text-white font-bold text-center max-w-[380px]">
              Welcome To the First AI Powered Rental Application{" "}
              <Text style={{ color: "#ffb343" }}>RentSpot</Text>
            </Text>

            <Image
            source={images.path}
            className= "w-[136px] h-[20px] absolute-bottom-1 -right-40"
            resizeMode="contain"
            />

            <CustomButton
            title = "Continue With Email"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-[300px] mt-5 justify-center self-center items-center"
            />
          </View>
        </View>
      </ScrollView>

      <StatusBar
      backgroundColor="#161622"
      style="light"
      />
    </SafeAreaView>

  );
}
