import React, { useEffect, useState, useContext } from "react";
import { View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
//import RegisterScreen from "../src/screens/RegisterScreen";
//import Home from "../src/screens/NavigationScreen/Home";
//import Verification from "../src/screens/Verification";
//import Onboarding from "../src/screens/Onboarding";
//import ForgotPassword from "../src/screens/ForgotPassword";
//import NewPassword from "../src/screens/NewPassword";
//import ProfileSetup from "../src/screens/ProfileSetup";

//mport EditProfile from "../src/screens/EditProfile";
//import UploadFirst from "../src/screens/Upload/UploadFirst";
//import UploadSecond from "../src/screens/Upload/UploadSecond";
//import UploadThird from "../src/screens/Upload/UploadThird";
//import { AuthContext } from "../src/context/AuthContext";
//import CategoriesProduct from "../src/screens/CategoriesProduct";
//import HomeStack from "./HomeStack";
//import EditProduct from "../src/screens/EditProduct";
//import SavedProduct from "../src/screens/SavedProduct";
//import Message from "../src/components/Message";
 // Make sure this component exists
//import UploadFourth from "../src/screens/Upload/UploadFourth";
//import UploadFifth from "../src/screens/Upload/UploadFifth";
//import EditImages from "../src/components/EditImages";
//import ReserveProduct from "../src/components/ReserveProduct";
//import Requests from "../src/components/Requests";
//import MyComments from "../src/components/MyComments";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "#E6EEF0",
          },
        }}
        initialRouteName="ScreenNavigator"
      >
        {
        // <Stack.Screen
        //   name="Onboarding"
        //   component={Onboarding}
        //   options={{ headerShown: false }}
        // />
        // <Stack.Screen
        //   name="ScreenNavigator"
        //   component={ScreenNavigator}
        //   options={{ headerShown: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="Login"
        //   component={LoginScreen}
        //   options={{ headerShown: true, gestureEnabled: false, title: "" }}
        // />
        // <Stack.Screen
        //   name="profileSetup"
        //   component={ProfileSetup}
        //   options={{ headerShown: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="ForgotPassword"
        //   component={ForgotPassword}
        //   options={{ headerShown: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="NewPassword"
        //   component={NewPassword}
        //   options={{ headerShown: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="Register"
        //   component={RegisterScreen}
        //   options={{ headerShown: true, gestureEnabled: false, title: "" }}
        // />
        // <Stack.Screen
        //   name="Reserve"
        //   component={ReserveProduct}
        //   options={{
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //     headerBackTitleVisible: true,
        //     headerTitle: "Reserve Product",
        //   }}
        // />
        // <Stack.Screen
        //   name="Verification"
        //   component={Verification}
        //   options={{ headerShown: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="EditProfile"
        //   component={EditProfile}
        //   options={{
        //     headerTitleStyle: { alignSelf: "center" },
        //     title: "Edit Profile",
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="SavedProduct"
        //   component={SavedProduct}
        //   options={{
        //     title: "Your Favourites",
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="Request"
        //   component={Requests}
        //   options={{
        //     title: "Reservations",
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="MyReviews"
        //   component={MyComments}
        //   options={{
        //     title: "My Reviews",
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="EditImage"
        //   component={EditImages}
        //   options={{
        //     title: "Edit Product",
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="Message"
        //   component={Message}
        //   options={({ route }) => ({
        //     title: route.params.name,
        //     headerShadowVisible: true,
        //     headerBackTitleVisible: false,
        //     gestureEnabled: false,
        //   })}
        // />
        // <Stack.Screen
        //   name="EditProduct"
        //   component={EditProduct}
        //   options={{
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //     headerBackTitleVisible: false,
        //     title: "Edit Product",
        //   }}
        // />

        // <Stack.Screen
        //   name="uploadFirst"
        //   component={UploadFirst}
        //   options={{ headerShadowVisible: false, gestureEnabled: false }}
        // />
        // <Stack.Screen
        //   name="uploadSecond"
        //   component={UploadSecond}
        //   options={{
        //     headerShown: false,
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="uploadThird"
        //   component={UploadThird}
        //   options={{
        //     headerShown: false,
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="uploadFourth"
        //   component={UploadFourth}
        //   options={{
        //     headerShown: false,
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        // <Stack.Screen
        //   name="uploadFifth"
        //   component={UploadFifth}
        //   options={{
        //     headerShown: false,
        //     headerShadowVisible: false,
        //     gestureEnabled: false,
        //   }}
        // />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;