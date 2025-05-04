import { router } from "expo-router";
import React, { useState, useEffect, useContext } from "react";
import { Alert, Image, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { useConfirmPayment, CardField, CardFieldInput } from '@stripe/stripe-react-native';
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
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentId, setPaymentId] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const { confirmPayment } = useConfirmPayment();

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

  useEffect(() => {
    // Debug router params and user context
    console.log("Paymentgateway - Router Params:", JSON.stringify(router.params, null, 2));
    console.log("Paymentgateway - Router Query:", JSON.stringify(router.query, null, 2));
    console.log("Paymentgateway - Full Router Object:", {
      pathname: router.pathname,
      params: router.params,
      query: router.query,
      asPath: router.asPath
    });
    console.log("Paymentgateway - Full User Context:", user);
    console.log("Paymentgateway - Token:", token);
    
    // Get booking details from router params/query
    // First try standard router params and query
    let paramsBookingId = router.query?.bookingId || router.params?.bookingId;
    let amount = router.query?.amount || router.params?.amount;
    
    // If that fails, try to get directly from URL search params if we have asPath
    if ((!paramsBookingId || !amount) && router.asPath) {
      try {
        // Extract query parameters from asPath
        const urlSearchParams = new URLSearchParams(router.asPath.split('?')[1] || '');
        if (!paramsBookingId) {
          paramsBookingId = urlSearchParams.get('bookingId');
          console.log("Extracted bookingId from URL search params:", paramsBookingId);
        }
        if (!amount) {
          amount = urlSearchParams.get('amount');
          console.log("Extracted amount from URL search params:", amount);
        }
      } catch (error) {
        console.error("Error parsing URL params:", error);
      }
    }
    
    // DEVELOPMENT ONLY: Hardcoded fallback values for debugging
    if (__DEV__ && (!paramsBookingId || !amount)) {
      console.warn("Using hardcoded values for debugging");
      paramsBookingId = paramsBookingId || router.params?.id || 32;
      amount = amount || 300;
    }
    
    console.log("Paymentgateway - Extracted Parameters:", {
      bookingId: paramsBookingId,
      amount: amount,
      source: {
        queryBookingId: router.query?.bookingId,
        paramsBookingId: router.params?.bookingId,
        queryAmount: router.query?.amount,
        paramsAmount: router.params?.amount
      }
    });
    
    if (!paramsBookingId) {
      console.error("Paymentgateway - No booking ID found in params/query");
      Alert.alert("Error", "Booking ID is missing. Please go back and try again.");
      router.back();
      return;
    }
    
    if (!amount) {
      console.error("Paymentgateway - No amount found in params/query");
      Alert.alert("Error", "Payment amount is missing. Please go back and try again.");
      router.back();
      return;
    }
    
    console.log("Paymentgateway - Setting state with:", {
      bookingId: paramsBookingId,
      amount: parseFloat(amount)
    });
    
    setBookingId(paramsBookingId);
    setPaymentAmount(parseFloat(amount));
    
    // Check if user ID is present, which is still needed for API calls
    if (!user?.id) {
        console.warn("Paymentgateway - No user ID in context, needed for API calls.");
        Alert.alert("Login Required", "Please log in to make a payment.");
        router.replace('/sign-in');
    }
  }, [router.params, router.query, router.asPath, user]);

  // Correct the email validation regex
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateFields = (isCardPayment = false) => {
    console.log("Validating fields...");
    console.log("Full User Context:", user);
    console.log("Full Name:", fullName);
    console.log("Email:", email);
    console.log("Payment Method:", paymentMethod);
    console.log("Booking ID:", bookingId);
    console.log("User ID:", user?.id);
    console.log("Payment Amount:", paymentAmount);
    
    if (!bookingId) {
      Alert.alert("Error", "Booking ID is missing. Please go back and try again.");
      return false;
    }
    
    if (!user?.id) {
      Alert.alert("Error", "Please log in to continue.");
      router.replace('/sign-in');
      return false;
    }
    
    if (!paymentAmount || isNaN(paymentAmount)) {
      Alert.alert("Error", "Payment amount is invalid. Please go back and try again.");
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
      const localBookingId = bookingId || router.params?.bookingId || 1;
      const userId = user?.id || router.params?.userId || 1;
      
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
        { amount, currency: 'aed', email, user_id: userId, booking_id: localBookingId },
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
    console.log("Handling Cash on Delivery...");
    if (!validateFields()) return;
    
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log("Making API request with:");
      console.log("Booking ID:", bookingId);
      console.log("User ID:", user?.id);
      console.log("Amount:", paymentAmount);
      console.log("Address:", address);
      console.log("Phone:", phoneNumber);
      
      const response = await axios.post(
        `${API_URL}/api/payments/create-cash-payment/`,
        { 
          user_id: user?.id, 
          booking_id: bookingId, 
          amount: paymentAmount, 
          address, 
          phone_number: phoneNumber 
        },
        { headers }
      );
      
      console.log("API Response:", response.data);
      
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
      console.error("Error in handleCashOnDelivery:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert("Payment Setup Failed", error.response?.data?.error || "Unable to setup cash on delivery. Please try again later.");
    }
  };

  const handleStripePayment = async () => {
    console.log("Handling Stripe Payment...");
    if (!validateFields(true)) return;
    
    try {
      setLoading(true);
      console.log("=== STRIPE PAYMENT PROCESSING ===");
      const { clientSecret, id } = await fetchPaymentIntentClientSecret();
      
      if (!clientSecret) {
        console.error("No client secret received from Stripe");
        setLoading(false);
        return;
      }
      
      // Extract payment intent ID from client secret for debugging
      try {
        // Client secret format is: pi_xxxxx_secret_yyyy
        // We want to extract pi_xxxxx part
        const paymentIntentId = clientSecret.split('_secret_')[0];
        console.log("🔍 Extracted Stripe Payment Intent ID:", paymentIntentId);
        console.log("📝 NOTE: Search for this ID in Stripe dashboard:", paymentIntentId);
        console.log("📊 Stripe Dashboard URL: https://dashboard.stripe.com/test/payments");
      } catch (e) {
        console.log("Could not extract payment intent ID from client secret");
      }
      
      console.log("Starting Stripe confirmPayment with client secret");
      console.log("Payment Method Type: Card");
      console.log("Billing Details:", { 
        name: fullName, 
        email,
        address: address || "Not provided"
      });
      
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { 
            name: fullName, 
            email,
            address: {
              line1: address
            }
          },
        },
      });
      
      setLoading(false);
      if (error) {
        console.error("❌ Stripe Payment Error:", error);
        console.error("❌ Error Code:", error.code);
        console.error("❌ Error Message:", error.message);
        console.error("❌ Error Type:", error.type);
        console.error("❌ Error Decline Code:", error.declineCode);
        Alert.alert('Payment Confirmation Error', error.message);
        return;
      } else if (paymentIntent) {
        console.log("✅ Stripe Payment Success!");
        console.log("✅ Payment Intent ID:", paymentIntent.id);
        console.log("✅ Payment Intent Status:", paymentIntent.status);
        console.log("✅ Full Payment Intent:", JSON.stringify(paymentIntent, null, 2));
        console.log("📊 Look for this Payment Intent ID in Stripe Dashboard:", paymentIntent.id);
        console.log("❗ If not visible in Stripe logs, check for:");
        console.log("  1. Test vs Live mode in Stripe Dashboard");
        console.log("  2. API key mismatch between frontend and backend");
        console.log("  3. Currency mismatch ('aed' vs other currencies)");
        console.log("  4. Sandbox/Test environment issues");
        
        if (id) {
          console.log("Updating payment status for ID:", id);
          updatePaymentStatus(id);
        }
        setSuccess(true);
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Stripe Payment Error:', error);
      console.error("❌ Error Stack:", error.stack);
      Alert.alert('Payment Error', 'An unexpected error occurred during payment processing.');
    }
  };

  const handleConfirm = () => {
    console.log("Confirm button clicked");
    console.log("Selected payment method:", paymentMethod);
    
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
        title={loading ? "Processing..." : "Confirm Transaction"} 
        containerStyles="mt-7 w-full" 
        handlePress={handleConfirm} 
        disabled={loading} 
      />

      <ReactNativeModal isVisible={success} onBackdropPress={() => setSuccess(false)}>
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={logo} className="w-28 h-28 mt-5" />
          <Text className="text-2xl text-center font-bold mt-5 text-black">Booking Request placed successfully.</Text>
          <Text className="text-md text-gray-500 text-center mt-3">Thank you for your booking Product. Your Rider will deliver your requested item soon. Please proceed.</Text>
          <CustomButton 
            title="Track Rider" 
            containerStyles="mt-5 w-full" 
            handlePress={() => { 
              setSuccess(false); 
              router.push({ pathname: "/Riderscreen", params: { bookingId: bookingId } }); 
            }} 
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

export default StripePaymentGateway;
