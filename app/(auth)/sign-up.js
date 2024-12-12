import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import SelectMultiple from "react-native-select-multiple";
import { API_URL } from "@env";

const categories = [
  { label: "Home and Kitchen Appliances", value: "Home and Kitchen Appliances" },
  { label: "Furniture", value: "Furniture" },
  { label: "Electronics and Gadgets", value: "Electronics and Gadgets" },
  { label: "Outdoor and Sports Equipment", value: "Outdoor and Sports Equipment" },
  { label: "Event and Party Supplies", value: "Event and Party Supplies" },
  { label: "Baby and Kids Items", value: "Baby and Kids Items" },
  { label: "Tools and Equipment", value: "Tools and Equipment" },
  { label: "Vehicles", value: "Vehicles" },
  { label: "Health and Wellness", value: "Health and Wellness" },
  { label: "Educational Resources", value: "Educational Resources" },
  { label: "Office Equipment", value: "Office Equipment" },
  { label: "Decor and Seasonal Items", value: "Decor and Seasonal Items" },
];

const SignUp = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    userType: "",
    interests: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const token = await AsyncStorage.getItem("accessToken");
      if (token) {
        Alert.alert("You are already logged in!");
        router.push("/home");
      }
    };

    checkUserLoggedIn();
  }, []);

  const handleInterestSelection = (selectedItems) => {
    setForm({
      ...form,
      interests: selectedItems.map((item) => item.value),
    });
  };

  const validateForm = () => {
    const { username, email, password, userType, interests } = form;

    if (!username.trim()) {
      Alert.alert("Validation Error", "Username cannot be empty.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return false;
    }

    if (password.length < 5) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 5 characters long."
      );
      return false;
    }

    if (!userType) {
      Alert.alert("Validation Error", "Please select a user type.");
      return false;
    }

    if (interests.length === 0) {
      Alert.alert("Validation Error", "Please select at least one interest.");
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/signup/`, {
        username: form.username,
        email: form.email,
        password: form.password,
        userType: form.userType,
        interests: form.interests,
      });

      if (response.status === 201) {
        Alert.alert(
          "Success",
          "Sign-up successful! Please sign in to your account."
        );
        router.push("/sign-in"); // Redirect to sign-in page
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Failed to sign up.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      {/* Use nestedScrollEnabled to avoid ScrollView conflicts */}
      <ScrollView nestedScrollEnabled>
        <View className="items-center justify-center">
          <Image
            source={logo}
            resizeMode="contain"
            className="w-[250px] h-[120px]"
          />
        </View>
        <View className="w-full justify-center min-h-[65vh] px-4 mb-3">
          <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold ">
            Sign Up to RentSpot!
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-7"
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            secureTextEntry={true}
          />

          <View className="mt-4 mb-3">
            <Text className="text-base text-gray-100 font-pmedium mb-2">
              User Type
            </Text>
            <View className="bg-black-100 border border-black-200 rounded-xl">
              <Picker
                selectedValue={form.userType}
                onValueChange={(value) => setForm({ ...form, userType: value })}
                style={{ color: "white", height: 50, marginHorizontal: 10 }}
              >
                <Picker.Item label="Select User Type" value="" />
                <Picker.Item label="Vendor" value="Vendor" />
                <Picker.Item label="Normal User" value="Normal User" />
              </Picker>
            </View>
          </View>

          <View className="mt-4 mb-3">
            <Text className="text-base text-gray-100 font-pmedium mb-2">
              Interests
            </Text>
            <View style={styles.multiSelectContainer}>
              <SelectMultiple
                items={categories}
                selectedItems={form.interests.map((interest) => ({
                  label: interest,
                  value: interest,
                }))}
                onSelectionsChange={handleInterestSelection}
                listProps={{ nestedScrollEnabled: true }} // Enable nested scrolling
              />
            </View>
          </View>

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
            <Link
              href="/sign-in"
              className="text-lg font-psemibold text-secondary"
            >
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  multiSelectContainer: {
    backgroundColor: "#1E1E2D",
    borderRadius: 15,
    padding: 10,
  },
});

export default SignUp;
