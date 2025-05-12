import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState, useContext, useEffect } from "react"; // Import useEffect
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from '@env';
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useContext(AuthContext); // Get user info too

  // useEffect to check if user is already logged in
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        // Get userType from storage to determine redirect
        const userTypeFromStorage = await AsyncStorage.getItem("userType");
        if (userTypeFromStorage === "Vendor") {
          router.push("/vendorhome");
        } else {
          router.push("/home");
        }
      }
    };

    checkIfLoggedIn(); // Run this on component mount
  }, []);

  // Redirect based on user type when user state updates
  useEffect(() => {
    if (user) {
      // Redirect based on user type
      if (user.userType === "Vendor") {
        console.log("Redirecting to vendor home page");
        router.push("/vendorhome");
      } else {
        console.log("Redirecting to regular home page");
        router.push("/home");
      }
    }
  }, [user]);

  const submit = async () => {
    console.log("Submitting login request");
    setIsSubmitting(true);
    try {
      // Make API request to login
      const response = await axios.post(`${API_URL}/api/users/login/`, {
        email: form.email,
        password: form.password,
      });

      console.log("Response received:", response.data);

      if (response.status === 200) {
        // Store userType if available in the response
        if (response.data.user_type) {
          await AsyncStorage.setItem("userType", response.data.user_type);
        }
        
        // Use login function from AuthContext and pass the full response data
        await login(response.data); // Pass entire response.data which contains access and refresh tokens

        // Show success alert
        Alert.alert("Success", "Login successful!");
        
        // Redirection will happen in the useEffect that watches the user state
      } else {
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
      setIsSubmitting(false);
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
              setForm({
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
              setForm({
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
