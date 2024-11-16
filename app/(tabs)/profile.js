import { 
  View,
  Text,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
  Keyboard,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Furniture from '../../assets/icons/living-room.png';
import CustomButton from "../../components/CustomButton";

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState(user ? user.username : ""); 
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");

  // Use a fallback image if user.avatar is undefined or not a valid string URL
  const avatarSource = user?.avatar && typeof user.avatar === 'string' ? 
    { uri: user.avatar } : 
    Furniture;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="bg-primary px-8 flex-1 h-full">
        <View className="items-center mt-4">
          <TouchableOpacity activeOpacity={1}>
            <View className="h-36 w-28 rounded-lg justify-center items-center">
              <ImageBackground
                source={avatarSource} // Uses avatarSource with fallback if necessary
                className="h-24 w-24"
                imageStyle={{ borderRadius: 15 }}
              />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-lg font-bold text-gray-100">{user?.email || "example@example.com"}</Text>
        </View>

        <View className="mt-8 flex-row border-b border-gray-300 pb-2 mb-6 ">
          <TextInput
            onChangeText={(text) => setName(text)}
            value={name}
            placeholder="Syed Asher Asif"
            autoCapitalize="none"
            keyboardType="ascii-capable"
            autoCorrect={false}
            className="flex-1 p-0 text-gray-100"
          />
        </View>

        <View className="flex-row border-b border-gray-300 pb-2 mb-6 text-gray-100">
          <TextInput
            onChangeText={(text) => setDate(text)}
            value={date}
            placeholder="Date of Birth"
            autoCapitalize="none"
            keyboardType="ascii-capable"
            autoCorrect={false}
            className="flex-1 p-0 text-gray-100"
          />
        </View>

        <CustomButton
            title="Log out"
           
            containerStyles="mt-7"
          />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default Profile;
