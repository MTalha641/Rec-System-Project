import { router } from "expo-router";
import React, { useState, useEffect, useContext } from "react";
import { Alert, Image, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { useConfirmPayment } from '@stripe/stripe-react-native';
import CustomButton from "../components/CustomButton";
import logo from "../assets/images/RLogo.png";
import pathImage from "../assets/images/path.png";
import { API_URL, STRIPE_PUBLISHABLE_KEY } from "@env";
import axios from 'axios';
import AuthContext from "./context/AuthContext";

const STRIPE_KEY = STRIPE_PUBLISHABLE_KEY;

const StripePaymentGateway = () => {
  const { token, user } = useContext(AuthContext);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentId, setPaymentId] = useState(null);
  const { confirmPayment } = useConfirmPayment();

  useEffect(() => {
    if (__DEV__) {
      console.log("Using Stripe Key:", STRIPE_KEY);
    }
  }, []);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateCardNumber = (number) => /^\d{16}$/.test(number.replace(/\s+/g, ''));
  const validateExpiryDate = (date) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(date);
  const validateCVC = (cvv) => /^\d{3,4}$/.test(cvv);

  const validateFields = () => {
    if (!fullName || !email || !validateEmail(email)) {
      Alert.alert("Invalid Details", "Please provide a valid full name and email address.");
      return false;
    }
    if (paymentMethod === "Credit Card") {
      if (!cardNumber || !validateCardNumber(cardNumber)) {
        Alert.alert("Invalid Card Number", "Please enter a valid 16-digit card number.");
        return false;
      }
      if (!expiryDate || !validateExpiryDate(expiryDate)) {
        Alert.alert("Invalid Expiry Date", "Please enter expiry date in MM/YY format.");
        return false;
      }
      if (!cvv || !validateCVC(cvv)) {
        Alert.alert("Invalid CVV", "Please enter a valid 3 or 4 digit CVV.");
        return false;
      }
    }
    if (paymentMethod === "Cash on Delivery" && (!address || !phoneNumber)) {
      Alert.alert("Incomplete Details", "Please fill in address and phone number before proceeding.");
      return false;
    }
    return true;
  };

  const updatePaymentStatus = async (paymentId) => {
    if (!paymentId || !token) return;
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await axios.post(
        `${API_URL}/api/payments/update-payment-status/`,
        { payment_id: paymentId, status: 'completed' },
        { headers }
      );
      console.log("Payment status updated:", response.data);
    } catch (error) {
      console.error("Failed to update payment status:", error);
    }
  };

  const fetchPaymentIntentClientSecret = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const amount = Math.round(paymentAmount * 100);
      const bookingId = router.params?.bookingId || 1;
      const userId = user?.id || router.params?.userId || 1;
      const response = await axios.post(
        `${API_URL}/api/payments/create-payment-intent/`,
        { amount, currency: 'pkr', email, user_id: userId, booking_id: bookingId },
        { headers }
      );
      const { clientSecret, id } = response.data;
      setPaymentId(id);
      setLoading(false);
      return { clientSecret, id };
    } catch (error) {
      setLoading(false);
      console.error("Error fetching payment intent:", error);
      Alert.alert("Payment Setup Failed", "Unable to setup payment. Please try again later.");
      return null;
    }
  };

  const handleCashOnDelivery = async () => {
    if (!validateFields()) return;
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const bookingId = router.params?.bookingId || 1;
      const userId = user?.id || router.params?.userId || 1;
      const response = await axios.post(
        `${API_URL}/api/payments/create-cash-payment-legacy/`,
        { user_id: userId, booking_id: bookingId, amount: paymentAmount, address, phone_number: phoneNumber },
        { headers }
      );
      setLoading(false);
      if (response.data.success) {
        if (response.data.payment?.id) {
          setPaymentId(response.data.payment.id);
        }
        setSuccess(true);
      } else {
        Alert.alert("Payment Setup Failed", "Unable to setup cash on delivery. Please try again later.");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error setting up cash payment:", error);
      Alert.alert("Payment Setup Failed", "Unable to setup cash on delivery. Please try again later.");
    }
  };

  const handleStripePayment = async () => {
    if (!validateFields()) return;
    try {
      setLoading(true);
      const { clientSecret, id } = await fetchPaymentIntentClientSecret();
      if (!clientSecret) {
        setLoading(false);
        return;
      }
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { name: fullName, email },
        },
      });
      setLoading(false);
      if (error) {
        Alert.alert('Payment Confirmation Error', error.message);
        return;
      } else if (paymentIntent) {
        if (id) updatePaymentStatus(id);
        setSuccess(true);
      }
    } catch (error) {
      setLoading(false);
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'An unexpected error occurred during payment processing.');
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === "Credit Card") {
      handleStripePayment();
    } else {
      handleCashOnDelivery();
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#161622] p-5">
      <Text className="text-3xl font-bold text-white mb-8 text-center">Payment Details</Text>
      <Image source={pathImage} className="w-[236px] h-[1100px] absolute -bottom-0 right-16" resizeMode="contain" />

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

      <TextInput placeholder="Full Name" placeholderTextColor="#ffffff" value={fullName} onChangeText={setFullName} className="w-full border border-gray-500 text-white p-3 mb-3 rounded" />
      <TextInput placeholder="Email (e.g. example@email.com)" placeholderTextColor="#ffffff" value={email} onChangeText={setEmail} keyboardType="email-address" className="w-full border border-gray-500 text-white p-3 mb-3 rounded" />

      {paymentMethod === "Credit Card" && (
        <>
          <TextInput placeholder="Card Number (e.g. 4242 4242 4242 4242)" placeholderTextColor="#ffffff" value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" className="w-full border border-gray-500 text-white p-3 mb-3 rounded" />
          <View className="flex flex-row w-full space-x-3">
            <TextInput placeholder="Expiry Date (MM/YY)" placeholderTextColor="#ffffff" value={expiryDate} onChangeText={setExpiryDate} keyboardType="numeric" className="flex-1 border border-gray-500 text-white p-3 rounded" />
            <TextInput placeholder="CVV (e.g. 123)" placeholderTextColor="#ffffff" value={cvv} onChangeText={setCvv} keyboardType="numeric" className="flex-1 border border-gray-500 text-white p-3 rounded" />
          </View>
        </>
      )}

      {paymentMethod === "Cash on Delivery" && (
        <>
          <TextInput placeholder="Address" placeholderTextColor="#ffffff" value={address} onChangeText={setAddress} className="w-full border border-gray-500 text-white p-3 mb-3 rounded" />
          <TextInput placeholder="Phone Number" placeholderTextColor="#ffffff" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" className="w-full border border-gray-500 text-white p-3 mb-3 rounded" />
        </>
      )}

      <CustomButton title={loading ? "Processing..." : "Confirm Transaction"} containerStyles="mt-7 w-full" handlePress={handleConfirm} disabled={loading} />

      <ReactNativeModal isVisible={success} onBackdropPress={() => setSuccess(false)}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">Booking Request placed successfully.</Text>
          <Text className="text-md text-gray-500 text-center mt-3">Thank you for your booking Product. Your Rider will deliver your requested item soon. Please proceed.</Text>
          <CustomButton title="Track Rider" containerStyles="mt-5 w-full" handlePress={() => { setSuccess(false); router.push("/Riderscreen"); }} />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default StripePaymentGateway;
