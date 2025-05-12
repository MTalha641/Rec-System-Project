import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { Slot, SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { AuthProvider } from "./context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_PUBLISHABLE_KEY } from "@env";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  // Add check for Stripe key
  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.error(
        "Stripe Publishable Key is missing in app/_layout.js! Check environment variables."
      );
      // Optionally, show an error to the user or prevent app load
    } else {
      console.log(
        "StripeProvider initializing in app/_layout.js with key:",
        STRIPE_PUBLISHABLE_KEY.substring(0, 10) + "..."
      );
    }
  }, []);

  if (!fontsLoaded && !error) return null;

  // Wrap AuthProvider and Stack with StripeProvider
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY || ""} // Provide key, default to empty string if missing to avoid crash
      // merchantIdentifier="merchant.com.your-app-name" // Optional: Add if using Apple Pay
    >
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="search/[query]" options={{ headerShown: false }}/>
          {/* <Stack.Screen name="ProductDetails/[id]" options={{ headerShown: false }} /> */}
          <Stack.Screen name="ReserveProduct" options={{ headerShown: false }}/>
          <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="Paymentgateway" options={{ headerShown: false }}/>
          <Stack.Screen name="Riderscreen" options={{ headerShown: false }} />
          <Stack.Screen name="MyProductsList" options={{ headerShown: false }}/>
          <Stack.Screen name="MySavedProducts" options={{ headerShown: false }}/>
          <Stack.Screen name="ProductReview" options={{ headerShown: false }} />
          <Stack.Screen name="DisputeForm" options={{ headerShown: false }} />
          <Stack.Screen name="category/[categoryName]" options={{ headerShown: false }}/>
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="vendorhome" options={{ headerShown: false }} />
          <Stack.Screen name="RiderscreenVendor" options={{ headerShown: false }}/>
          <Stack.Screen name="InspectionReport" options={{ headerShown: false }}/>
          <Stack.Screen name="RideHistory" options={{ headerShown: false }}/>
          <Stack.Screen name="ManageRides" options={{ headerShown: false }}/>
        </Stack>
      </AuthProvider>
    </StripeProvider>
  );
};

export default RootLayout;

//_Layout Is like a Home Page/ Main Page
//Stack.Screen/Stack is used to view different screens of out app.
