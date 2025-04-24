import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
  } from "react-native";
  import React, { useState, useEffect, useContext } from "react";
  import { useLocalSearchParams, router } from "expo-router";
  import { Ionicons } from "@expo/vector-icons";
  import axios from "axios";
  import { API_URL } from "@env";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { AuthContext } from "../context/AuthContext";
  
  const CategoryPage = () => {
    const { categoryName } = useLocalSearchParams();
    const { token } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      fetchCategoryItems();
    }, [categoryName]);
  
    const fetchCategoryItems = async () => {
      if (!token) {
        console.warn("No token available!");
        setLoading(false);
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        // Get all items
        const response = await axios.get(`${API_URL}/api/items/getallitems/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response?.data) {
          // Filter items by category name
          const filteredItems = response.data.filter(
            (item) => item.category === categoryName
          );
          setItems(filteredItems);
        } else {
          console.warn("No data received from the API");
          setItems([]);
        }
      } catch (error) {
        console.error(
          "Error fetching category items:",
          error.response?.data || error.message
        );
        setError("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    const ProductCard = ({ item }) => (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image 
          source={item.image ? { uri: `${API_URL}${item.image}` } : require("../../assets/images/RLogo.png")} 
          resizeMode="contain" 
          style={styles.image} 
        />
        <View style={styles.content}>
          <Text style={styles.title}>
            {item.title.slice(0, 25)}
            {item.title.length > 25 && "..."}
          </Text>
          <Text style={styles.price}>PKR {item.price}</Text>
          <Text style={styles.category}>{item.sub_category}</Text>
          <View style={styles.bottomRow}>
            <TouchableOpacity
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.viewButton}
            >
              <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName}</Text>
        </View>
  
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ProductCard item={item} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No items found in this category.</Text>
            }
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      color: "#FF6B6B",
      fontSize: 16,
      textAlign: "center",
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
      backgroundColor: "#2a2a3a",
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
    price: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#00BFFF",
      marginTop: 4,
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
  