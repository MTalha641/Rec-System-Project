import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from '@env';



const SignIn = () => {
  const [form, setform] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setisSubmitting] = useState(false);

  // Store token in AsyncStorage
  const storeToken = async (token) => {
    try {
      await AsyncStorage.setItem("accessToken", token);
      console.log("Token stored successfully");
    } catch (error) {
      console.log("Failed to store token", error);
    }
  };

  
  const submit = async () => {
    console.log("Submitting login request"); 
    setisSubmitting(true);
    try {
      // Make API request to login
      const response = await axios.post(`${API_URL}/api/users/login/`, {
        email: form.email,
        password: form.password,
      });


      console.log("Response received:", response.data);

 
      if (response.status === 200) {
        const { access } = response.data; // Extract access token

        // Store access token in AsyncStorage
        await storeToken(access);

        // Show success alert
        Alert.alert("Success", "Login successful!");

        // Navigate to home page
        router.push("/home");
      } else {
        // Handle other status codes
        Alert.alert("Error", "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.log("Error received:", error); // Log error for debugging
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Login failed.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setisSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="items-center justify-center">
          <Image source={logo} resizeMode="contain" className="w-[250px] h-[170px]" />
        </View>
        <View className="w-full justify-center min-h-[60vh] px-4 mb-3">
          <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold">
            Log in to RentSpot!
          </Text>

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) =>
              setform({
                ...form,
                email: e,
              })
            }
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) =>
              setform({
                ...form,
                password: e,
              })
            }
            otherStyles="mt-7"
            secureTextEntry={true} // Hide password input
          />

          <CustomButton
            title="Sign in"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">Don't have an account?</Text>
            <Link href="/sign-up" className="text-lg font-psemibold text-secondary">
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
