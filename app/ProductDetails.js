export const unstable_settings = {
    headerShown: false,
  };
  
  import React, { useState } from "react";
  import {
    View,
    FlatList,
    Dimensions,
    Image,
    TouchableOpacity,
    ScrollView,
    Text,
    Button,
    Alert,
  } from "react-native";
  import { useRouter } from "expo-router";
  import FontAwesome from "react-native-vector-icons/FontAwesome";
  import Fontisto from "react-native-vector-icons/Fontisto";
  import moment from "moment";
  import { SafeAreaView } from 'react-native-safe-area-context';
  import racquet from "../assets/images/racquet.jpg"
  
  // Uncomment these imports if using external components
  // import MapView, { Marker } from "react-native-maps";
  // import Ratings from "../components/Ratings";
  // import Reviews from "../components/Reviews";
  // import RenterProfile from "./RenterProfile";
  
  const { width } = Dimensions.get("window");
  
  const ProductDetails = () => {
    const router = useRouter();
    const [userEmail] = useState("dummyuser@example.com");
    const [displayPrice, setDisplayPrice] = useState(100); // Default price
    const [isSaved, setIsSaved] = useState(false);
  
    // Dummy product data
    const product = {
      productID: "123",
      title: "Table Tennis Racquet",
      description: "This is a sample product description.",
      price: 100,
      rating: 4.5,
      totalReviews: 10,
      imageIds: [racquet],
      latitude: 25.053109,
      longitude: 67.121006,
      timeStamp: new Date(),
      email: "renter@example.com"
    };
    const data = product.imageIds;
    const [buttonGroup, setButtonGroup] = useState("");
    
    const handleSaveProduct = () => {
      setIsSaved(!isSaved);
      Alert.alert("Saved", isSaved ? "Product removed from saved!" : "Product saved!");
    };
  
    const handleReserveProduct = () => {
      Alert.alert("Reserve Product", "Reservation feature is under development.");
    };
  
    const renderItem = ({ item, index }) => (
      <View
        key={index}
        style={{
          width: width,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{ width: "90%", height: "90%", borderRadius: 10 }}>
          <Image
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "white",
              borderRadius: 10,
            }}
            source={item}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  
    return (
      <SafeAreaView className="bg-primary h-full" style={{ flex: 1}}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              horizontal
              renderItem={renderItem}
            />
          </View>
          <View style={{ flexDirection: "row", width, justifyContent: "center", alignItems: "center" }}>
            {data.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 10,
                  height: 5,
                  borderRadius: 5,
                  backgroundColor: index === 0 ? "#475FCB" : "gray",
                  marginLeft: 5,
                }}
              />
            ))}
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text className="text-gray-100 text-lg font-pregular mb-3">{product.title}</Text>
              <TouchableOpacity onPress={handleSaveProduct}>
                <FontAwesome name={isSaved ? "heart" : "heart-o"} size={24} color="white" />
              </TouchableOpacity>
            </View>
            {/* Dummy Ratings component placeholder */}
            {/* <Ratings value={product.rating} text={product.rating.toString()} total={product.totalReviews} /> */}
            <View style={{ flexDirection: "row", marginVertical: 10 }}>
              <Fontisto name="date" size={14} color="white" />
              <Text style={{ fontSize: 14 }}> {moment(product.timeStamp).fromNow()}</Text>
            </View>
            <Text className="text-gray-100 text-lg font-pregular mb-3">Description</Text>
            <Text style={{ fontSize: 14, color: "white" }}>{product.description}</Text>
            <Text className="text-gray-100 text-lg font-pregular mb-3">Location</Text>
            {/* Uncomment MapView code if using react-native-maps */}
            {/* 
            <MapView
              style={{ height: 200, borderRadius: 10, borderColor: "black", borderWidth: 0.2 }}
              region={{
                latitude: product.latitude,
                longitude: product.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.00421,
              }}
            >
              <Marker coordinate={{ latitude: product.latitude, longitude: product.longitude }} title="Marker" />
            </MapView>
            */}
            <Text className="text-gray-100 text-lg font-pregular mb-3">Rating and Reviews</Text>
            {/* Dummy Reviews component placeholder */}
            {/* <Reviews id={product.productID} /> */}
            {/* Uncomment RenterProfile if needed */}
            {/* <RenterProfile email={product.email} currentUser={product.email === userEmail} /> */}
          </View>
        </ScrollView>
        <View
        className="bg-black-100"
        style={{
          borderColor: "1px solid white",
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.34,
          shadowRadius: 6.27,
          elevation: 10
        }}>
          <Text style={{ fontSize: 22, color: "#475FCB", marginBottom: 10 }}>
            PKR {displayPrice}/day
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", borderRadius: "15px" }}>
            <Button title="Day" onPress={() => setDisplayPrice(100)} color={buttonGroup === "" ? "#475FCB" : "#ccc"} />
            <Button title="Week" onPress={() => setDisplayPrice(85)} color={buttonGroup === "Week" ? "#475FCB" : "#ccc"} />
            <Button title="Month" onPress={() => setDisplayPrice(70)} color={buttonGroup === "Month" ? "#475FCB" : "#ccc"} />
            <Button title="Reserve" onPress={handleReserveProduct} color="#475FCB" />
          </View>
        </View>
      </SafeAreaView>
    );
  };
  
  export default ProductDetails;
  
  ProductDetails.options = {
    headerShown: false,  // This hides the header for this page
  };