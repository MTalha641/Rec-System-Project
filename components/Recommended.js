import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { API_URL } from '@env';
import { AuthContext } from "../app/context/AuthContext";
import ProductCard from "./ProductCard"; 

const Recommended = () => {
  const { token } = useContext(AuthContext); // Access token from AuthContext
  const [posts, setPosts] = useState([]); 
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      if (!token) {
        console.error("No token available");
        return;
      }

      setLoading(true);

      try {
        // Log token to verify it's being sent
        console.log("Authorization Token:", `Bearer ${token}`);

        const response = await axios.get(`${API_URL}/api/recommendations/getrecommendation`, {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token in headers
          },
        });

        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching recommended products:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedProducts();
  }, [token]);

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity style={{ width: 150 }}>
      <ProductCard product={item} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1E1E1E", padding: 16 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.productID.toString()}
          renderItem={renderTrendingItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ marginTop: 20 }}
        />
      )}

      {!loading && posts.length === 0 && (
        <Text style={{ color: "#FFFFFF", textAlign: "center", marginTop: 20 }}>
          No recommended products available.
        </Text>
      )}
    </View>
  );
};

export default Recommended;
