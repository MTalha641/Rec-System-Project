import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState, useEffect, useContext } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_URL } from '@env';
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

const SignUp = () => {
  const { login } = useContext(AuthContext); // Get login function from context
  const [form, setform] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setisSubmitting] = useState(false);

  // Check if the user is already logged in by checking the token
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // If token exists, navigate to home
        Alert.alert("You are already logged in!");
        router.push("/home"); // Redirect to home if already logged in
      }
    };

    checkUserLoggedIn(); // Call the function when the component mounts
  }, []); // Only run on the initial render

  // Sign-up API integration with JWT handling
  const submit = async () => {
    setisSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/signup/`, {
        username: form.username,
        email: form.email,
        password: form.password,
      });
  
      console.log('Signup response:', response.data);
  
      if (response.status === 201) {
        const accessToken = response.data.access;
        const refreshToken = response.data.refresh;
  
        if (accessToken && refreshToken) {
          // Call the login function with both tokens
          login({ access: accessToken, refresh: refreshToken });
  
          Alert.alert("Success", "Sign-up successful!");
          router.push("/home");
        } else {
          Alert.alert("Error", "Tokens not received from server.");
        }
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.log("Error:", error);
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Failed to sign up.");
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
          <Image source={logo} resizeMode="contain" className="w-[250px] h-[120px]" />
        </View>
        <View className="w-full justify-center min-h-[65vh] px-4 mb-3">
          <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold ">
            Sign Up to RentSpot!
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) =>
              setform({
                ...form,
                username: e,
              })
            }
            otherStyles="mt-7"
          />

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
            title="Sign Up"
            handlePress={submit}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Have an Account already?
            </Text>
            <Link href="/sign-in" className="text-lg font-psemibold text-secondary">
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
