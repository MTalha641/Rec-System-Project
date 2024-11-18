import { useState } from "react";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import { icons } from "../../constants";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";

const categories = [
  {
    name: "Home and Kitchen Appliances",
    icon: "🍳",
    subcategories: [
      { name: "Small Appliances", icon: "🍞" },
      { name: "Large Appliances", icon: "🏠" },
      { name: "Kitchen Gadgets", icon: "🔪" },
    ],
  },
  {
    name: "Furniture",
    icon: "🪑",
    subcategories: [
      { name: "Living Room", icon: "🛋️" },
      { name: "Dining Room", icon: "🍽️" },
      { name: "Bedroom", icon: "🛏️" },
      { name: "Office Furniture", icon: "💼" },
    ],
  },
  {
    name: "Electronics and Gadgets",
    icon: "📱",
    subcategories: [
      { name: "Tech Equipment", icon: "🔌" },
      { name: "Computing Devices", icon: "💻" },
      { name: "Audio Visual", icon: "🎧" },
    ],
  },
  {
    name: "Outdoor and Sports Equipment",
    icon: "🏕️",
    subcategories: [
      { name: "Camping Gear", icon: "⛺" },
      { name: "Sports Equipment", icon: "🏀" },
      { name: "Fitness Equipment", icon: "🏋️" },
    ],
  },
  {
    name: "Event and Party Supplies",
    icon: "🎉",
    subcategories: [
      { name: "Event Equipment", icon: "🎤" },
      { name: "Tableware", icon: "🍴" },
      { name: "Decor", icon: "🌸" },
    ],
  },
  {
    name: "Baby and Kids Items",
    icon: "🍼",
    subcategories: [{ name: "Baby Gear", icon: "🛁" }],
  },
  {
    name: "Tools and Equipment",
    icon: "🔧",
    subcategories: [
      { name: "Home Improvement", icon: "🛠️" },
      { name: "Workshop Gear", icon: "🗜️" },
    ],
  },
  {
    name: "Vehicles",
    icon: "🚗",
    subcategories: [{ name: "Transport", icon: "🚚" }],
  },
  {
    name: "Health and Wellness",
    icon: "💊",
    subcategories: [
      { name: "Medicine", icon: "🩺" },
      { name: "Wellness Devices", icon: "🛁" },
    ],
  },
  {
    name: "Educational Resources",
    icon: "📚",
    subcategories: [
      { name: "Books", icon: "📖" },
      { name: "Learning Tools", icon: "🖊️" },
    ],
  },
  {
    name: "Office Equipment",
    icon: "📂",
    subcategories: [{ name: "Meeting Supplies", icon: "🖨️" }],
  },
  {
    name: "Decor and Seasonal Items",
    icon: "🎨",
    subcategories: [
      { name: "Home Decor", icon: "🏡" },
      { name: "Seasonal Decorations", icon: "🎄" },
    ],
  },
];

const create = () => {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    location: "",
    category: "",
    subcategory: "",
    image: null,
    description: "",
  });

  const [subcategories, setSubcategories] = useState([]);

  const openPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/png", "image/jpg", "image/jpeg"],
    });

    if (!result.canceled) {
      setForm({
        ...form,
        image: result.assets[0],
      });
    } else {
      setTimeout(() => {
        Alert.alert("Document picked", JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  const handleCategoryChange = (selectedCategory) => {
    const selectedData = categories.find(
      (item) => item.name === selectedCategory
    );
    setForm({
      ...form,
      category: selectedCategory,
      subcategory: "",
    });
    setSubcategories(selectedData ? selectedData.subcategories : []);
  };

  const submit = async () => {
    if (
      form.title === "" ||
      form.price === "" ||
      form.location === "" ||
      form.category === "" ||
      form.subcategory === "" ||
      form.description === "" ||
      !form.image
    ) {
      return Alert.alert("Please provide all fields");
    }

    setUploading(true);
    try {
      Alert.alert("Success", "Ad uploaded successfully");
      router.push("/home");
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setForm({
        title: "",
        price: "",
        location: "",
        category: "",
        subcategory: "",
        image: null,
        description: "",
      });
      setUploading(false);
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">Upload Ad</Text>

        <FormField
          title="Ad Title"
          value={form.title}
          placeholder="Give your ad a catchy title..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles="mt-10 mb-5"
        />

        <FormField
          title="Price"
          value={form.price}
          placeholder="Enter the price..."
          handleChangeText={(e) => setForm({ ...form, price: e })}
          otherStyles="mt-4 mb-3"
        />

        <FormField
          title="Location"
          value={form.location}
          placeholder="Enter the location..."
          handleChangeText={(e) => setForm({ ...form, location: e })}
          otherStyles="mt-4 mb-3"
        />

        {/* Category Dropdown */}
        <View className="mt-4 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">
            Category
          </Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.category}
              onValueChange={(value) => handleCategoryChange(value)}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map((item) => (
                <Picker.Item
                  key={item.name}
                  label={`${item.icon} ${item.name}`}
                  value={item.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Subcategory Dropdown */}
        {/* Subcategory Dropdown */}
        <View className="mt-4 mb-3">
          <Text className="text-base text-gray-100 font-pmedium mb-2">
            Subcategory
          </Text>
          <View className="bg-black-100 border border-black-200 rounded-xl">
            <Picker
              selectedValue={form.subcategory}
              onValueChange={(value) =>
                setForm({ ...form, subcategory: value })
              }
              enabled={!!form.category}
              style={{ color: "white", height: 50, marginHorizontal: 10 }}
            >
              <Picker.Item label="Select a subcategory" value="" />
              {subcategories.map((item) => (
                <Picker.Item
                  key={item.name}
                  label={`${item.icon} ${item.name}`}
                  value={item.name}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View className="mt-4 mb-3 space-y-2 ">
          <Text className="text-base text-gray-100 font-pmedium">
            Upload Image
          </Text>
          <TouchableOpacity onPress={openPicker}>
            {form.image ? (
              <Image
                source={{ uri: form.image.uri }}
                resizeMode="cover"
                className="w-full h-64 rounded-2xl"
              />
            ) : (
              <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                  <Image
                    source={icons.upload}
                    resizeMode="contain"
                    alt="upload"
                    className="w-1/2 h-1/2"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FormField
          title="Ad Description"
          value={form.description}
          placeholder="Describe your ad here..."
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-4 mb-3"
        />

        <CustomButton
          title="Submit & Publish"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={uploading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default create;
