import { router } from "expo-router";
import React, { useState, useEffect, useContext, useRef } from "react";
import { Alert, Image, Text, TextInput, View, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { useConfirmPayment, CardField, CardFieldInput } from '@stripe/stripe-react-native';
import CustomButton from "../components/CustomButton";
import logo from "../assets/images/RLogo.png";
import pathImage from "../assets/images/path.png";
import { API_URL, STRIPE_PUBLISHABLE_KEY } from "@env";
import axios from 'axios';
import {AuthContext} from "./../context/AuthContext";
import { useLocalSearchParams } from 'expo-router';

const STRIPE_KEY = STRIPE_PUBLISHABLE_KEY;

const StripePaymentGateway = () => {
  const { token, user } = useContext(AuthContext);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentId, setPaymentId] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const { confirmPayment } = useConfirmPayment();
  
  // Get URL parameters using useLocalSearchParams
  const params = useLocalSearchParams();
  
  // Use a ref to track if parameters have been extracted
  const paramsExtracted = useRef(false);

  // Verify Stripe initialization
  useEffect(() => {
    console.log("=== STRIPE INITIALIZATION VERIFICATION ===");
    console.log("Stripe Publishable Key:", STRIPE_KEY ? "Available" : "Not Available");
    console.log("Stripe Key Length:", STRIPE_KEY?.length || 0);
    console.log("First few characters of key:", STRIPE_KEY?.substring(0, 10) + "...");
    
    if (!STRIPE_KEY) {
      console.error("Stripe key is missing! Check your environment variables.");
    }
    
    console.log("confirmPayment function from useConfirmPayment:", confirmPayment ? "Available" : "Not Available");
    console.log("Stripe React Native Integration Status:", confirmPayment ? "Working" : "Not Working");
  }, []);

  // Retrieve bookingId and amount from URL parameters - only once
  useEffect(() => {
    // Skip if parameters have already been extracted
    if (paramsExtracted.current) return;
    
    console.log("Payment Gateway received local search params:", params);
    
    // Extract parameters directly from useLocalSearchParams hook
    const urlBookingId = params.bookingId;
    const urlAmount = params.amount;
    
    console.log("Extracted URL parameters:", { urlBookingId, urlAmount });
    
    // Check if we have both required parameters
    if (!urlBookingId || !urlAmount) {
      console.error("Missing required parameters:", { urlBookingId, urlAmount });
      Alert.alert(
        "Missing Parameters",
        "Required booking information is missing. Please go back and try again.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
      return;
    }
    
    // Set booking ID from URL parameters
    console.log("Setting bookingId from URL:", urlBookingId);
    setBookingId(urlBookingId);
    
    // Set payment amount from URL parameters
    const parsedAmount = parseFloat(urlAmount);
    console.log("Setting amount from URL:", parsedAmount);
    setPaymentAmount(parsedAmount);
    
    // Pre-fill email from user context if available
    if (user?.email) {
      setEmail(user.email);
    }
    
    if (user?.full_name) {
      setFullName(user.full_name);
    }
    
    // Mark parameters as extracted to prevent repeated calls
    paramsExtracted.current = true;
  }, [params, user, router]);

  // Debug function to test Stripe integration
  const testStripeIntegration = async () => {
    try {
      console.log("\n\n");
      console.log("======================================");
      console.log("=== TESTING STRIPE INTEGRATION ===");
      console.log("======================================");
      
      if (!STRIPE_KEY) {
        console.error("❌ Stripe key is missing!");
        Alert.alert("Stripe Test", "Stripe key is missing. Check your environment variables.");
        return;
      }
      
      if (!confirmPayment) {
        console.error("❌ confirmPayment function is not available!");
        Alert.alert("Stripe Test", "Stripe React Native integration is not working properly.");
        return;
      }
      
      // Check if using test mode
      const isTestKey = STRIPE_KEY.startsWith('pk_test_');
      console.log("✅ Using Stripe Test Mode:", isTestKey ? "Yes" : "No");
      console.log("⚠️ Make sure you're viewing the correct area in Stripe Dashboard:", 
                 isTestKey ? "TEST mode" : "LIVE mode");
      
      // Check backend Stripe configuration
      try {
        console.log("Checking backend Stripe configuration...");
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const response = await axios.get(
          `${API_URL}/api/payments/config/`,
          { headers }
        );
        
        console.log("✅ Backend Stripe Configuration:", response.data);
        console.log("✅ Backend Publishable Key:", response.data.publishableKey ? "Available" : "Not Available");
        
        // Compare keys for debugging
        if (response.data.publishableKey && STRIPE_KEY) {
          const backendKeyStart = response.data.publishableKey.substring(0, 10);
          const frontendKeyStart = STRIPE_KEY.substring(0, 10);
          console.log("✅ Keys match?", backendKeyStart === frontendKeyStart ? "Yes" : "No");
          
          if (backendKeyStart !== frontendKeyStart) {
            console.error("❌ API KEY MISMATCH! Frontend and backend keys are different!");
            console.log("Frontend key starts with:", frontendKeyStart);
            console.log("Backend key starts with:", backendKeyStart);
          }
        }
        
        // Make a test call to get currency configuration
        try {
          console.log("Checking currency configuration...");
          // Create a minimal payment intent to check currency
          const testResponse = await axios.post(
            `${API_URL}/api/payments/create-payment-intent/`,
            { 
              amount: 100, 
              currency: 'aed', 
              email: user?.email || 'test@example.com', 
              user_id: user?.id || 1, 
              booking_id: 1 
            },
            { headers }
          );
          
          // Check if we get a response with a clientSecret
          if (testResponse.data && testResponse.data.clientSecret) {
            console.log("✅ Successfully created test payment intent");
            
            // Check if we can extract the PI ID
            try {
              const testPiId = testResponse.data.clientSecret.split('_secret_')[0];
              console.log("✅ Test Payment Intent ID:", testPiId);
              console.log("📊 IMPORTANT: Search for this exact ID in your Stripe dashboard");
              console.log("📊 Stripe Dashboard URL: https://dashboard.stripe.com/test/payments");
              
              Alert.alert(
                "Stripe Test",
                `Test payment intent created successfully! Look for this ID in your Stripe dashboard: ${testPiId}`,
                [
                  {
                    text: "OK",
                    onPress: () => console.log("OK Pressed")
                  }
                ]
              );
            } catch (e) {
              console.error("Error extracting Payment Intent ID", e);
            }
          }
        } catch (error) {
          console.error("❌ Error creating test payment intent:", error.message);
          console.log("⚠️ This might explain why payments aren't showing in Stripe logs");
          
          if (error.response && error.response.data) {
            console.log("Error details:", error.response.data);
            
            // Check for currency issues
            if (error.response.data.toString().includes("currency")) {
              console.error("❌ POSSIBLE CURRENCY MISMATCH DETECTED!");
              console.log("⚠️ Your frontend is using 'aed' but backend might be using a different currency");
              console.log("⚠️ Check backend/payments/views.py for currency settings");
            }
          }
        }
      } catch (error) {
        console.error("❌ Error checking backend Stripe configuration:", error);
        console.error("❌ Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      
      console.log("✅ Stripe integration test completed!");
      console.log("======================================\n\n");
    } catch (error) {
      console.error("❌ Error testing Stripe integration:", error);
      Alert.alert("Stripe Test Error", error.message);
    }
  };

  // Validate fields before payment
  const validateFields = (isCardPayment = false) => {
    console.log("Validating fields with bookingId:", bookingId);
    console.log("Current payment amount:", paymentAmount);
    
    if (!bookingId) {
      console.error("Missing booking ID in validateFields");
      Alert.alert(
        "Missing Booking ID",
        "There was an issue with the booking information. Would you like to retry with a test booking ID?",
        [
          {
            text: "Yes, use test ID",
            onPress: () => {
              setBookingId("1");
              Alert.alert("Test ID Set", "Now you can try confirming payment again.");
            }
          },
          {
            text: "No, go back",
            onPress: () => router.back(),
            style: "cancel"
          }
        ]
      );
      return false;
    }
    
    if (!paymentAmount || isNaN(paymentAmount)) {
      console.error("Invalid payment amount:", paymentAmount);
      Alert.alert(
        "Invalid Amount",
        "Payment amount is invalid or missing. Would you like to use a default test amount?",
        [
          {
            text: "Yes, use default",
            onPress: () => {
              setPaymentAmount(1500);
              Alert.alert("Default Amount Set", "Now you can try confirming payment again.");
            }
          },
          {
            text: "No, go back",
            onPress: () => router.back(),
            style: "cancel"
          }
        ]
      );
      return false;
    }
    
    if (isCardPayment) {
      if (!fullName || !email || !validateEmail(email)) {
        Alert.alert("Invalid Details", "Please provide a valid full name and email address.");
        return false;
      }
    }
    
    if (paymentMethod === "Cash on Delivery" && (!address || !phoneNumber)) {
      Alert.alert("Incomplete Details", "Please fill in address and phone number before proceeding.");
      return false;
    }
    
    return true;
  };
  
  // Email validation function
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Update payment status in backend
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
      console.log("=== STRIPE INTEGRATION VERIFICATION ===");
      console.log("Starting payment intent creation with Stripe...");
      console.log("Stripe Key Available:", !!STRIPE_KEY);
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const amount = Math.round(paymentAmount * 100);
      const localBookingId = bookingId || params.bookingId || 1;
      const userId = user?.id || params.userId || 1;
      
      console.log("Stripe Payment Request Payload:", { 
        amount, 
        currency: 'aed', 
        email, 
        user_id: userId, 
        booking_id: localBookingId 
      });
      
      console.log("API Endpoint:", `${API_URL}/api/payments/create-payment-intent/`);
      
      const response = await axios.post(
        `${API_URL}/api/payments/create-payment-intent/`,
        { 
          amount, 
          currency: 'aed', 
          email, 
          user_id: userId, 
          booking_id: localBookingId
        },
        { headers }
      );
      
      console.log("✅ Stripe Payment Intent API Response Status:", response.status);
      console.log("✅ Stripe Response Headers:", JSON.stringify(response.headers, null, 2));
      console.log("✅ Stripe Response Data:", JSON.stringify(response.data, null, 2));
      console.log("Stripe Payment Intent API Response:", {
        success: !!response.data,
        clientSecret: response.data?.clientSecret ? "Available" : "Not Available",
        paymentId: response.data?.id
      });
      
      const { clientSecret, id } = response.data;
      setPaymentId(id);
      setLoading(false);
      return { clientSecret, id };
    } catch (error) {
      setLoading(false);
      console.error("❌ Error fetching Stripe payment intent:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response) {
        console.error("❌ Full error response:", JSON.stringify(error.response.data, null, 2));
      }
      
      Alert.alert("Payment Setup Failed", "Unable to setup payment. Please try again later.");
      return null;
    }
  };

  const handleCashOnDelivery = async () => {
    if (!validateFields(false)) return;
    
    try {
      setLoading(true);
      
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log("Creating cash payment for booking:", bookingId);
      
      const response = await axios.post(
        `${API_URL}/api/payments/create-cash-payment/`,
        { 
          user_id: user?.id,
          booking_id: bookingId, 
          amount: paymentAmount,
          email: email || user?.email,
          full_name: fullName,
          address: address,
          phone_number: phoneNumber,
          payment_method: "cash_on_delivery"
        },
        { headers }
      );
      
      console.log("Cash payment response:", response.data);
      
      // If we get any response with status 200, consider it successful
      if (response.status === 200) {
        const paymentId = response.data?.id || response.data?.payment_id;
        if (paymentId) {
          setPaymentId(paymentId);
          await updatePaymentStatus(paymentId);
        }
        // Show success modal regardless of whether we got an ID
        setSuccess(true);
      } else {
        Alert.alert("Error", "Failed to create payment record.");
      }
    } catch (error) {
      console.error("Error creating COD payment:", error.message);
      console.error("Error details:", error.response?.data);
      Alert.alert("Error", "Failed to process cash on delivery payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!validateFields(true)) return;
    
    try {
      setLoading(true);
      const paymentIntentData = await fetchPaymentIntentClientSecret();
      
      if (!paymentIntentData || !paymentIntentData.clientSecret) {
        setLoading(false);
        Alert.alert("Error", "Failed to initialize payment. Please try again.");
        return;
      }
      
      const { error, paymentIntent } = await confirmPayment(paymentIntentData.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { 
            email: email,
            name: fullName, 
            phone: phoneNumber,
            address: {
              line1: address,
            }
          }
        }
      });
      
      if (error) {
        console.error("Payment confirmation error:", error.message);
        Alert.alert("Payment Failed", error.message);
      } else if (paymentIntent) {
        console.log("Payment successful");
        
        // Update payment status
        const currentPaymentId = paymentId || paymentIntentData.id;
        if (currentPaymentId) {
          await updatePaymentStatus(currentPaymentId);
        }
        
        setSuccess(true);
      }
    } catch (error) {
      console.error("Error processing payment:", error.message);
      Alert.alert("Payment Error", error.message || "Failed to process payment");
    } finally {
      setLoading(false);
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

      {/* Debug button for Stripe verification (only in development) */}
      {__DEV__ && (
        <TouchableOpacity 
          onPress={testStripeIntegration}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: '#333',
            padding: 5,
            borderRadius: 5,
            zIndex: 100
          }}
        >
          <Text style={{ color: 'white', fontSize: 10 }}>Test Stripe</Text>
        </TouchableOpacity>
      )}

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

      <TextInput 
        placeholder="Full Name" 
        placeholderTextColor="#ffffff" 
        value={fullName} 
        onChangeText={setFullName} 
        className="w-full border border-gray-500 text-white p-3 mb-3 rounded" 
      />
      <TextInput 
        placeholder="Email (e.g. example@email.com)" 
        placeholderTextColor="#ffffff" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address" 
        className="w-full border border-gray-500 text-white p-3 mb-3 rounded" 
      />

      {paymentMethod === "Credit Card" && (
        <>
          <CardField
            postalCodeEnabled={false}
            autofocus
            style={{
              width: '100%',
              height: 50,
              marginVertical: 10,
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
              fontSize: 16,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#CCCCCC',
            }}
            placeholder={{
              number: 'Card Number',
            }}
          />
        </>
      )}

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
        title={loading ? "Processing..." : "Confirm Payment"} 
        containerStyles="mt-7 w-full" 
        handlePress={handleConfirm} 
        disabled={loading} 
      />

      <Modal
        transparent={true}
        visible={success}
        animationType="slide"
        onRequestClose={() => setSuccess(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View className="bg-white p-7 rounded-2xl w-[90%] max-w-[400px]">
            <Image source={logo} className="w-28 h-28 mt-5 self-center" />
            <Text className="text-2xl text-center font-bold mt-5 text-black">Payment Successful!</Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              {paymentMethod === "Cash on Delivery" 
                ? "Your cash on delivery payment has been registered. We're now waiting for a driver to accept your delivery request." 
                : "Your payment has been processed. We're now waiting for a driver to accept your delivery request."}
            </Text>
            <CustomButton 
              title="Track Delivery Status" 
              containerStyles="mt-5 w-full" 
              handlePress={() => { 
                setSuccess(false);
                router.push(`/Riderscreen?bookingId=${bookingId}`);
              }} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StripePaymentGateway;
