import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import {Slot, SplashScreen, Stack} from 'expo-router'
import {useFonts} from 'expo-font'
import { AuthProvider } from './context/AuthContext';

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

    if(error) throw error;
    if(fontsLoaded) SplashScreen.hideAsync()

  }, [fontsLoaded,error])
  
  if(!fontsLoaded && !error) return null;

  return (
    <AuthProvider>
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search/[query]" options={{ headerShown: false }} />
      {/* <Stack.Screen name="ProductDetails/[id]" options={{ headerShown: false }} /> */}
      <Stack.Screen name="ReserveProduct" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{headerShown:false}} />
    </Stack>
  </AuthProvider>
  
    
  )
}

export default RootLayout

//_Layout Is like a Home Page/ Main Page 
//Stack.Screen/Stack is used to view different screens of out app.