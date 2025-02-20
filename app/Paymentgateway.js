import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Text, TextInput, View, TouchableOpacity } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import dummyImage1 from "../assets/images/racquet.jpg";
import CustomButton from "../components/CustomButton";
import logo from "../assets/images/RLogo.png";
import pathImage from "../assets/images/path.png"; // Ensure the correct path

const Paymentgateway = () => {
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const validateFields = () => {
    if (!fullName || !email) {
      Alert.alert("Incomplete Details", "Please fill in all the fields before proceeding.");
      return false;
    }
    if (paymentMethod === "Credit Card" && (!cardNumber || !expiryDate || !cvv)) {
      Alert.alert("Incomplete Details", "Please fill in all credit card details before proceeding.");
      return false;
    }
    if (paymentMethod === "Cash on Delivery" && (!address || !phoneNumber)) {
      Alert.alert("Incomplete Details", "Please fill in address and phone number before proceeding.");
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (validateFields()) {
      setSuccess(true);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#161622] p-5">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Payment Details</Text>
      
      {/* Positioned Image */}
      <Image 
        source={pathImage} 
        className="w-[236px] h-[1100px] absolute -bottom-0 right-16"
        resizeMode="contain" 
      />
      
      {/* Payment Method Selection */}
      <View className="flex flex-row w-full justify-between mb-5 mt-6">
        <TouchableOpacity
          className={`flex-1 items-center p-3 rounded-lg border ${paymentMethod === "Credit Card" ? "border-blue-500 bg-blue-700" : "border-gray-500"}`}
          onPress={() => setPaymentMethod("Credit Card")}
        >
          <Text className="text-white">Credit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center p-3 rounded-lg border ml-2 ${paymentMethod === "Cash on Delivery" ? "border-green-500 bg-green-700" : "border-gray-500"}`}
          onPress={() => setPaymentMethod("Cash on Delivery")}
        >
          <Text className="text-white">Cash on Delivery</Text>
        </TouchableOpacity>
      </View>
      
      {/* Common Fields */}
      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#ffffff"
        value={fullName}
        onChangeText={setFullName}
        className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#ffffff"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
      />

      {/* Render Credit Card Fields if selected */}
      {paymentMethod === "Credit Card" && (
        <>
          <TextInput
            placeholder="Card Number"
            placeholderTextColor="#ffffff"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="numeric"
            className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
          />
          <View className="flex flex-row w-full space-x-3">
            <TextInput
              placeholder="Expiry Date"
              placeholderTextColor="#ffffff"
              value={expiryDate}
              onChangeText={setExpiryDate}
              keyboardType="numeric"
              className="flex-1 border border-gray-500 text-white p-3 rounded"
            />
            <TextInput
              placeholder="CVV"
              placeholderTextColor="#ffffff"
              value={cvv}
              onChangeText={setCvv}
              keyboardType="numeric"
              className="flex-1 border border-gray-500 text-white p-3 rounded"
            />
          </View>
        </>
      )}

      {/* Render Address & Phone for Cash on Delivery */}
      {paymentMethod === "Cash on Delivery" && (
        <>
          <TextInput
            placeholder="Address"
            placeholderTextColor="#ffffff"
            value={address}
            onChangeText={setAddress}
            className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
          />
          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#ffffff"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
          />
        </>
      )}

      <CustomButton
        title="Confirm Transaction"
        containerStyles="mt-7 w-full"
        handlePress={handleConfirm}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">
            Booking Request placed successfully.
          </Text>
          <Text className="text-md text-gray-500 text-center mt-3">
            Thank you for your booking Request. Your reservation will be approved by Product Owner.
            Please proceed.
          </Text>
          <CustomButton
            title="Back Home"
            containerStyles="mt-5 w-full"
            handlePress={() => {
              setSuccess(false);
              router.push("/home");
            }}
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default Paymentgateway;
