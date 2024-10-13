import { StyleSheet, Text, View, ScrollView, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/RLogo.png";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";

const SignIn = () => {
  const [form, setform] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setisSubmitting] = useState(false);

  const submit = () => {};

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View
        className="items-center  
        justify-center "
        >
        <Image
            source={logo}
            resizeMode="contain"
            className="w-[250px] h-[170px]"
          />
        </View>
        <View className="w-full   
        justify-center min-h-[60vh] px-4 mb-3">
         

          <Text className="text-2xl text-white text-semibold mt-5 mb-3 font-psemibold ">
            Log in to RentSpot!
          </Text>

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) =>
              setform({
                ...form,
                email: e,
              })
            }
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) =>
              setform({
                ...form,
                password: e,
              })
            }
            otherStyles="mt-7"
          />

          <CustomButton
            title="Sign in"
            handlePress={() => router.push('/home')}
            containerStyles="mt-7"
            isLoading={isSubmitting}
          />
          
          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Dont have an account? 
            </Text>
            <Link href="/sign-up" className="text-lg font-psemibold text-secondary">Sign Up</Link>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
