import React, { useState} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "../constants/icons";
import CustomButton from "../components/CustomButton";
import FormField from "../components/FormField";
import { ReactNativeModal } from "react-native-modal";
import logo from "../assets/images/RLogo.png";
import { Ionicons } from "@expo/vector-icons";

const disputeCategories = [
  { name: "Payment Dispute" },
  { name: "Item Condition Dispute" },
];

const DisputeForm = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    category: "",
    description: "",
    image: null,
  });

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const openPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
      });

      if (!result.canceled) {
        const { uri, name, mimeType } = result.assets[0];
        setForm({
          ...form,
          image: {
            uri: uri.startsWith("file://") ? uri : `file://${uri}`,
            name: name || "image.jpg",
            type: mimeType || "image/jpeg",
          },
        });
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const handleSubmit = () => {
    if (!form.category || !form.description || !form.image) {
      Alert.alert("Missing Fields", "Please complete all fields before submitting.");
      return;
    }

    // Simulate upload (you can replace this with real API call)
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Disputes</Text>
      </View>
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">File your Dispute here</Text>

        {/* Category Dropdown */}
        <View className="mt-10 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">Dispute Category</Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.category}
              onValueChange={(value) => setForm({ ...form, category: value })}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a category" value="" />
              {disputeCategories.map((item) => (
                <Picker.Item key={item.name} label={item.name} value={item.name} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Description Field */}
        <FormField
          title="Description"
          value={form.description}
          placeholder="Describe the issue in detail..."
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-4 mb-3"
        />

        {/* Upload Image */}
        <View className="mt-4 mb-3 space-y-2">
          <Text className="text-base text-gray-100 font-pmedium">Upload Image</Text>
          <TouchableOpacity onPress={openPicker}>
            {form.image ? (
              <Image source={{ uri: form.image.uri }} resizeMode="cover" className="w-full h-64 rounded-2xl" />
            ) : (
              <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                  <Image source={icons.upload} resizeMode="contain" alt="upload" className="w-1/2 h-1/2" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <CustomButton
          title="Submit Dispute"
          containerStyles="mt-7"
          isLoading={uploading}
          handlePress={handleSubmit}
        />

        {/* Success Modal */}
        <ReactNativeModal isVisible={success} onBackdropPress={() => setSuccess(false)}>
          <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
            <Image source={logo} className="w-28 h-28 mt-5" />
            <Text className="text-2xl text-center font-bold mt-5 text-black">
              Dispute Filed successfully.
            </Text>
            <Text className="text-md text-gray-500 text-center mt-3">
              Thank you for your submission. Our Team will look into your case and will get back to you.
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default DisputeForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#161622",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#1E1E2D",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  
});


