import { StyleSheet, Text, View, ScrollView, Image, Alert } from "react-native";
import React, { useState, useEffect, useContext } from "react";
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
import { AuthContext } from "../../context/AuthContext";

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
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResendingOTP, setIsResendingOTP] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds
  const [registeredEmail, setRegisteredEmail] = useState("");
  
  const { login } = useContext(AuthContext);

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

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (showOTPScreen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showOTPScreen, otpTimer]);

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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        console.log("Registration response:", response.data);
        
        // Check if OTP verification is required
        if (response.data.requires_otp) {
          setRegisteredEmail(form.email);
          setShowOTPScreen(true);
          setOtpTimer(300); // Reset timer to 5 minutes
          Alert.alert(
            "Registration Successful!",
            "Please check your email for the OTP code to verify your account."
          );
        } else {
          // For existing users or if OTP is bypassed
          Alert.alert(
            "Success",
            "Sign-up successful! Please sign in to your account."
          );
          router.push("/sign-in");
        }
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Failed to sign up.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Validation Error", "Please enter the OTP code.");
      return;
    }

    if (otp.length !== 6) {
      Alert.alert("Validation Error", "OTP must be 6 digits long.");
      return;
    }

    console.log("=== FRONTEND OTP VERIFICATION DEBUG ===");
    console.log("Registered email:", registeredEmail);
    console.log("OTP value:", otp);
    console.log("OTP type:", typeof otp);
    console.log("OTP length:", otp.length);
    console.log("API URL:", API_URL);

    const requestData = {
      email: registeredEmail,
      otp: otp,
    };
    console.log("Request data:", requestData);

    setIsVerifyingOTP(true);
    try {
      console.log("Sending request to:", `${API_URL}/api/users/verify-otp/`);
      const response = await axios.post(`${API_URL}/api/users/verify-otp/`, requestData);

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      if (response.status === 200) {
        console.log("OTP verification response:", response.data);
        
        // Auto-login after successful verification
        if (response.data.access && response.data.refresh) {
          await login(response.data);
          Alert.alert(
            "Success!",
            "Email verified successfully! You are now logged in.",
            [
              {
                text: "Continue",
                onPress: () => {
                  // Redirect based on user type
                  if (response.data.user?.user_type === "Vendor") {
                    router.push("/vendorhome");
                  } else {
                    router.push("/home");
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Success!",
            "Email verified successfully! Please sign in to your account.",
            [
              {
                text: "Sign In",
                onPress: () => router.push("/sign-in")
              }
            ]
          );
        }
      } else {
        Alert.alert("Error", "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "OTP verification failed.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const resendOTP = async () => {
    setIsResendingOTP(true);
    try {
      const response = await axios.post(`${API_URL}/api/users/send-otp/`, {
        email: registeredEmail,
      });

      if (response.status === 200) {
        setOtpTimer(300); // Reset timer to 5 minutes
        setOtp(""); // Clear current OTP input
        Alert.alert("Success", "New OTP sent to your email!");
      } else {
        Alert.alert("Error", "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      if (error.response && error.response.data) {
        Alert.alert("Error", error.response.data.error || "Failed to resend OTP.");
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setIsResendingOTP(false);
    }
  };

  const goBackToSignUp = () => {
    setShowOTPScreen(false);
    setOtp("");
    setRegisteredEmail("");
    setOtpTimer(300);
  };

  if (showOTPScreen) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <ScrollView>
          <View className="items-center justify-center">
            <Image
              source={logo}
              resizeMode="contain"
              className="w-[250px] h-[120px]"
            />
          </View>
          <View className="w-full justify-center min-h-[65vh] px-4 mb-3">
            <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold">
              Verify Your Email
            </Text>
            
            <Text className="text-base text-gray-100 font-pregular mb-4">
              We've sent a 6-digit verification code to:
            </Text>
            <Text className="text-lg text-secondary font-pmedium mb-6">
              {registeredEmail}
            </Text>

            <FormField
              title="Enter OTP Code"
              value={otp}
              handleChangeText={setOtp}
              otherStyles="mt-4"
              keyboardType="numeric"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />

            <View className="flex-row justify-between items-center mt-4 mb-6">
              <Text className="text-sm text-gray-100 font-pregular">
                Code expires in: {formatTime(otpTimer)}
              </Text>
              {otpTimer === 0 && (
                <Text className="text-sm text-red-500 font-pmedium">
                  Code expired
                </Text>
              )}
            </View>

            <CustomButton
              title="Verify Email"
              handlePress={verifyOTP}
              containerStyles="mt-4"
              isLoading={isVerifyingOTP}
              disabled={otpTimer === 0}
            />

            <CustomButton
              title={isResendingOTP ? "Resending..." : "Resend OTP"}
              handlePress={resendOTP}
              containerStyles="mt-4 bg-gray-600"
              isLoading={isResendingOTP}
              disabled={otpTimer > 240} // Allow resend only after 1 minute
            />

            <CustomButton
              title="Back to Sign Up"
              handlePress={goBackToSignUp}
              containerStyles="mt-4 bg-transparent border border-secondary"
              textStyles="text-secondary"
            />

            <View className="justify-center pt-5 flex-row gap-2">
              <Text className="text-lg text-gray-100 font-pregular">
                Already have an account?
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
  }

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
