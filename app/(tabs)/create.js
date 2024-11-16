import { View,ScrollView ,Text,Image} from "react-native";
import React from "react";
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryButton from "../../components/CategoryButton";
import Furniture from '../../assets/icons/living-room.png'; // Assuming you're using a .png icon'
import { images } from "../../constants";
import logo from '../../assets/images/RLogo.png';
import { AuthContext } from "../context/AuthContext";

// Categories array provided
const categories = [
  { name: "Tools", icon: Furniture },
  { name: "Equipment", icon: Furniture },
  { name: "Appliances", icon: Furniture },
  { name: "Apparel", icon: Furniture },
  { name: "Footwear", icon: Furniture },
  { name: "Kitchenware", icon: Furniture },
  { name: "Furniture", icon: Furniture },
  { name: "Technology", icon: Furniture },
  { name: "Toys", icon: Furniture },
  { name: "Mobile Phones", icon: Furniture },
  { name: "Sports", icon: Furniture },
  { name: "Fashion", icon: Furniture },
  { name: "Books", icon: Furniture },
  { name: "Servies", icon: Furniture },
  { name: "Others", icon: Furniture },
];

const create = () => {
  
  return (
    <SafeAreaView className="flex-1 bg-primary h-full">
      <View className="relative">

      <View
        className="items-center  
        justify-center "
        >
        <Image
            source={logo}
            resizeMode="contain"
            className="w-[220px] h-[140px]"
          />
        </View>

      <Text className="text-3xl text-white font-bold text-center max-w-[380px]">
              Create your own{" "}
              <Text style={{ color: "#ffb343" }}>Ad</Text>
            </Text>
            <Text className="text-3xl text-white font-bold text-center max-w-[380px]">
              Choose your{" "}
              <Text style={{ color: "#ffb343" }}>Category</Text>
            </Text>

            <Image
            
            source={images.path}
            className= "w-[136px] h-[20px] absolute-bottom-1 relative -right-[200px]"
            resizeMode="contain"
            />
       </View>     
      <View className="flex-1 px-5 pt-4"> 
        <ScrollView showsVerticalScrollIndicator={false} className="h-full">
        
          <View className="flex flex-wrap flex-row justify-between mb-4"> 
            {categories.map((item, index) => (
              <View key={index} className="w-[30%] mb-6"> 
                <CategoryButton
                  Icon={item.icon}
                  IconName={item.name}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default create;
