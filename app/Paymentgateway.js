import { router } from "expo-router";
import React, { useState, useEffect, useContext } from "react";
import { Alert, Image, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { StripeProvider, useStripe, CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import dummyImage1 from "../assets/images/racquet.jpg";
import CustomButton from "../components/CustomButton";
import logo from "../assets/images/RLogo.png";
import pathImage from "../assets/images/path.png";
import { API_URL, STRIPE_PUBLISHABLE_KEY } from "@env";
import axios from 'axios';
import AuthContext from "./context/AuthContext";

// Fallback to a test key if environment variable is not set
const STRIPE_KEY = STRIPE_PUBLISHABLE_KEY 

const StripePaymentGateway = () => {
  const { token, user } = useContext(AuthContext);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardDetails, setCardDetails] = useState(null);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1500); // Default amount in PKR (15 PKR)
  const [paymentId, setPaymentId] = useState(null);
  const { confirmPayment, loading: stripeLoading } = useConfirmPayment();

  // Show stripe key in development mode
  useEffect(() => {
    if (__DEV__) {
      console.log("Using Stripe Key:", STRIPE_KEY);
    }
  }, []);

  const validateFields = () => {
    if (!fullName || !email) {
      Alert.alert("Incomplete Details", "Please fill in all the fields before proceeding.");
      return false;
    }
    
    if (paymentMethod === "Credit Card") {
      if (!cardDetails?.complete) {
        Alert.alert("Invalid Card", "Please enter valid card details.");
        return false;
      }
    } else if (paymentMethod === "Cash on Delivery" && (!address || !phoneNumber)) {
      Alert.alert("Incomplete Details", "Please fill in address and phone number before proceeding.");
      return false;
    }
    
    return true;
  };

  // Update payment status to completed after successful payment
  const updatePaymentStatus = async (paymentId) => {
    if (!paymentId || !token) return;
    
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Using a simple approach since we removed the webhook
      // In a real app, you might want to create a specific endpoint for this
      const response = await axios.post(
        `${API_URL}/api/payments/update-payment-status/`,
        {
          payment_id: paymentId,
          status: 'completed'
        },
        { headers }
      );
      
      console.log("Payment status updated:", response.data);
    } catch (error) {
      console.error("Failed to update payment status:", error);
      // Payment still succeeded, so we don't need to alert the user
    }
  };

  const fetchPaymentIntentClientSecret = async () => {
    try {
      setLoading(true);
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Calculate amount in smallest currency unit (e.g., cents)
      // For PKR, multiply by 100 to convert to paisa
      const amount = Math.round(paymentAmount * 100);
      
      // Get current booking ID from navigation params or context
      // This is placeholder - you'll need to get the actual booking ID
      const bookingId = router.params?.bookingId || 1;
      const userId = user?.id || router.params?.userId || 1;
      
      const response = await axios.post(
        `${API_URL}/api/payments/create-payment-intent/`,
        {
          amount,
          currency: 'pkr',
          email,
          user_id: userId,
          booking_id: bookingId
        },
        { headers }
      );
      
      const { clientSecret, id } = response.data;
      
      // Save the payment ID for later status update
      setPaymentId(id);
      
      setLoading(false);
      return { clientSecret, id };
    } catch (error) {
      setLoading(false);
      console.error("Error fetching payment intent:", error);
      Alert.alert(
        "Payment Setup Failed", 
        "Unable to setup payment. Please try again later."
      );
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
      
      // Get current booking ID from navigation params or context
      // This is placeholder - you'll need to get the actual booking ID
      const bookingId = router.params?.bookingId || 1;
      const userId = user?.id || router.params?.userId || 1;
      
      const response = await axios.post(
        `${API_URL}/api/payments/create-cash-payment-legacy/`,
        {
          user_id: userId,
          booking_id: bookingId,
          amount: paymentAmount,
          address: address,
          phone_number: phoneNumber
        },
        { headers }
      );
      
      setLoading(false);
      
      if (response.data.success) {
        console.log('Cash payment setup successful');
        
        // Save payment ID if available
        if (response.data.payment && response.data.payment.id) {
          setPaymentId(response.data.payment.id);
        }
        
        setSuccess(true);
      } else {
        Alert.alert(
          "Payment Setup Failed", 
          "Unable to setup cash on delivery. Please try again later."
        );
      }
    } catch (error) {
      setLoading(false);
      console.error("Error setting up cash payment:", error);
      Alert.alert(
        "Payment Setup Failed", 
        "Unable to setup cash on delivery. Please try again later."
      );
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
      
      // Confirm the payment with the card details
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { 
            name: fullName,
            email 
          },
        },
      });
      
      setLoading(false);
      
      if (error) {
        Alert.alert('Payment Confirmation Error', error.message);
        return;
      } else if (paymentIntent) {
        console.log('Payment successful', paymentIntent);
        
        // Update payment status directly since we're not using webhooks
        if (id) {
          updatePaymentStatus(id);
        }
        
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
          <View className="w-full mb-3">
            <Text className="text-white mb-1">Card Information</Text>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: '4242 4242 4242 4242',
              }}
              cardStyle={{
                backgroundColor: '#1E1E2D',
                textColor: '#FFFFFF',
                placeholderColor: '#888888',
                borderWidth: 1,
                borderColor: '#555555',
                borderRadius: 8,
              }}
              style={{
                width: '100%',
                height: 50,
                marginVertical: 10,
              }}
              onCardChange={cardDetails => {
                setCardDetails(cardDetails);
              }}
            />
          </View>
          
          <TextInput
            placeholder="Price (PKR)"
            placeholderTextColor="#ffffff"
            value={paymentAmount.toString()}
            onChangeText={(value) => setPaymentAmount(Number(value) || 0)}
            keyboardType="numeric"
            className="w-full border border-gray-500 text-white p-3 mb-3 rounded"
          />
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
        title={loading ? "Processing..." : "Confirm Transaction"}
        containerStyles="mt-7 w-full"
        handlePress={handleConfirm}
        disabled={loading || stripeLoading}
      />
      
      {(loading || stripeLoading) && (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
      )}

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">
            Payment Successful!
          </Text>
          <Text className="text-md text-gray-500 text-center mt-3">
            Thank you for your payment. Your booking request has been confirmed.
            Your rider will deliver your requested item soon.
          </Text>
          <CustomButton
            title="Track Rider"
            containerStyles="mt-5 w-full"
            handlePress={() => {
              setSuccess(false);
              router.push("/Riderscreen");
            }}
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

const Paymentgateway = () => (
  <StripeProvider publishableKey={STRIPE_KEY}>
    <StripePaymentGateway />
  </StripeProvider>
);

export default Paymentgateway;
