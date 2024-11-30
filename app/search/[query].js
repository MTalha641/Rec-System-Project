import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductCard from "../../components/ProductCard"; // Import ProductCard component

// Mock Product Data
const mockProducts = [
  {
    id: "1",
    title: "Modern Sofa Set",
    price: "5000",
    imageids: [{ uri: "https://via.placeholder.com/300" }],
    category: "Furniture",
  },
  {
    id: "2",
    title: "Gaming Laptop",
    price: "15000",
    imageids: [{ uri: "https://via.placeholder.com/300" }],
    category: "Electronics",
  },
  {
    id: "3",
    title: "Yoga Mat",
    price: "800",
    imageids: [{ uri: "https://via.placeholder.com/300" }],
    category: "Fitness",
  },
  {
    id: "4",
    title: "Baby Stroller",
    price: "1200",
    imageids: [{ uri: "https://via.placeholder.com/300" }],
    category: "Baby Gear",
  },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

const Search = () => {
  const [query, setQuery] = useState(""); // Local state for search query
  const [products, setProducts] = useState(mockProducts); // Local state for filtered products (default to all products)

  // Update products based on the query
  useEffect(() => {
    handleSearch(query);
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setProducts(mockProducts); // If query is empty, show all products
      return;
    }

    // Filter products matching the query
    const filteredProducts = mockProducts.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setProducts(filteredProducts);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={(text) => setQuery(text)} // Update query state
        />
      </View>

      {/* Product List */}
      <FlatList
        data={products} // Render filtered products
        keyExtractor={(item) => item.id} // Use product ID as key
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={() => (
          <Text style={styles.subtitle}>
            {query ? `Search Results for "${query}"` : "All Products"}
          </Text>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for a different item.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#161622", // Primary background color
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchInput: {
    backgroundColor: "#333",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
    marginLeft: 16,
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.8, // 80% of the screen width
    alignSelf: "center", // Center the card horizontally
    marginVertical: 8, // Add vertical spacing between cards
  },
  emptyState: {
    alignItems: "center",
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#B0B0B0",
    marginTop: 8,
  },
});

export default Search;
