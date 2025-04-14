import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
  } from "react-native";
  import React from "react";
  import { useLocalSearchParams, router } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import logo from "../../assets/images/RLogo.png";
  import { SafeAreaView } from "react-native-safe-area-context";
  
  const dummyAds = [
    { id: "1", title: "Hammer Tool", category: "Tools" },
    { id: "2", title: "Microwave Oven", category: "Appliances" },
    { id: "3", title: "Gaming Laptop", category: "Computing" },
    { id: "4", title: "T-Shirt Pack", category: "Apparel" },
    { id: "5", title: "Sneakers", category: "Footwear" },
    { id: "10", title: "Sneakers", category: "Footwear" },
    { id: "6", title: "Sofa Set", category: "Furniture" },
    { id: "7", title: "Gas Stove", category: "Kitchenware" },
    { id: "8", title: "Drill Machine", category: "Equipment" },
    { id: "9", title: "Misc Item 1", category: "Others" },
  ];
  
  const CategoryPage = () => {
    const { categoryName } = useLocalSearchParams();
  
    const filteredAds = dummyAds.filter((item) => item.category === categoryName);
  
    const ProductCard = ({ item }) => (
      <View style={styles.card}>
        <Image source={logo} resizeMode="contain" style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.title}>
            {item.title.slice(0, 25)}
            {item.title.length > 25 && "..."}
          </Text>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.bottomRow}>
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.viewButton}
            >
              <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName} Products</Text>
        </View>
  
        <FlatList
          data={filteredAds}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No ads found for this category.</Text>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      </SafeAreaView>
    );
  };
  
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
      marginBottom: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
      marginLeft: 10,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#1E1E2D",
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 130,
      marginBottom: 11,
      elevation: 1,
    },
    image: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    content: {
      flex: 1,
      marginLeft: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    category: {
      color: "#cccccc",
      marginTop: 4,
    },
    bottomRow: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    viewButton: {
      backgroundColor: "#005fff",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    emptyText: {
      textAlign: "center",
      color: "#ffffff",
      marginTop: 40,
      fontSize: 16,
    },
  });
  
  export default CategoryPage;
  