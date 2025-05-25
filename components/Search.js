import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "@env";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "./ProductCard";

const Search = () => {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `${API_URL}/api/items/search/?query=${encodeURIComponent(
            debouncedQuery
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const processedResults = response.data.map((item) => ({
          ...item,
          image: item.image
            ? `${API_URL}${item.image}`
            : "https://via.placeholder.com/150",
        }));

        setResults(processedResults);
      } catch (error) {
        console.error("Error searching items:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, token]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            query ? (
              <Text style={styles.noResults}>No results found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsContainer: {
    padding: 10,
  },
  loader: {
    marginTop: 20,
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});

export default Search;
