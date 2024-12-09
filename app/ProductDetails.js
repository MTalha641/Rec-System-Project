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
import { SafeAreaView } from "react-native-safe-area-context";
import racquet from "../assets/images/racquet.jpg";
import MapView, { Marker } from "react-native-maps";
import Review from "../components/Review";

const { width } = Dimensions.get("window");

const ProductDetails = () => {
  const router = useRouter();
  const [userEmail] = useState("dummyuser@example.com");
  const [displayPrice, setDisplayPrice] = useState(100);
  const [isSaved, setIsSaved] = useState(false);

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
    email: "renter@example.com",
  };
  const data = product.imageIds;

  const handleSaveProduct = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      "Saved",
      isSaved ? "Product removed from saved!" : "Product saved!"
    );
  };

  const handleReserveProduct = () => {
    router.push({
      pathname: "/ReserveProduct",
    });
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
    <SafeAreaView className="bg-primary h-full" style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      >
        <View
          style={{
            height: 200,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            renderItem={renderItem}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            width,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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
            <Text className="text-gray-100 text-2xl font-pregular mb-3">
              {product.title}
            </Text>
            <TouchableOpacity onPress={handleSaveProduct}>
              <FontAwesome
                name={isSaved ? "heart" : "heart-o"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", marginVertical: 10 }}>
            <Fontisto name="date" size={14} color="white" />
            <Text style={{ fontSize: 14, color: "white" }}>
              {" "}
              {moment(product.timeStamp).format("MMMM D, YYYY")}{" "}
              {/* Display current date */}
            </Text>
          </View>
          <Text className="text-gray-100 text-lg font-pregular mb-3">
            Description
          </Text>
          <Text style={{ fontSize: 14, color: "white" }}>
            {product.description}
          </Text>
          <Text className="text-gray-100 text-lg font-pregular mb-3">
            Location
          </Text>
          <MapView
            style={{
              height: 200,
              borderRadius: 10,
              borderColor: "black",
              borderWidth: 0.2,
              marginBottom: "10px",
            }}
            region={{
              latitude: product.latitude,
              longitude: product.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.00421,
            }}
          >
            <Marker
              coordinate={{
                latitude: product.latitude,
                longitude: product.longitude,
              }}
              title="Marker"
            />
          </MapView>
        </View>

        <View>
          <Text className="text-gray-100 text-lg font-pregular ml-5 mt-4">
            Rating and Reviews
          </Text>
          <Review />
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
          elevation: 10,
        }}
      >
        <Text style={{ fontSize: 22, color: "#475FCB", marginBottom: 10 }}>
          PKR {displayPrice}/day
        </Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderRadius: "15px",
          }}
        >
          <Button title="Day" onPress={() => setDisplayPrice(100)} />
          <Button title="Week" onPress={() => setDisplayPrice(85)} />
          <Button title="Month" onPress={() => setDisplayPrice(70)} />
          <Button
            title="Reserve"
            onPress={handleReserveProduct}
            color="#475FCB"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetails;
