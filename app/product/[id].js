import React, { useEffect, useState, useContext } from "react";
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
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Fontisto from "react-native-vector-icons/Fontisto";
import moment from "moment";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import Review from "../../components/Reviews";
import axios from 'axios';
import {API_URL} from "@env";
import AuthContext from "../context/AuthContext";

const { width } = Dimensions.get("window");

const ProductDetails = () => {
  console.log("🔄 ProductDetails: Component initializing");
  const router = useRouter();
  const { id } = useLocalSearchParams();
  console.log(`🔍 ProductDetails: Product ID from params: ${id}`);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [isSaved, setIsSaved] = useState(false);
  const { token, loading: authLoading, user } = useContext(AuthContext);
  
  // Debug log for auth context
  console.log(`🔍 ProductDetails: Auth state - token exists: ${!!token}, token length: ${token?.length || 0}, authLoading: ${authLoading}, user exists: ${!!user}`);
  
  // Parse location string to get latitude and longitude
  const getLocationCoordinates = (locationString) => {
    if (!locationString) return { latitude: 0, longitude: 0 };
    const [latitude, longitude] = locationString.split(',').map(coord => parseFloat(coord));
    return { latitude, longitude };
  };

  // Fix: Use a ref to track if we've already attempted to fetch
  const [hasFetchAttempted, setHasFetchAttempted] = useState(false);

  // Fix: Separate effect to track token changes for debugging
  useEffect(() => {
    console.log(`🔄 ProductDetails: Token changed - hasToken: ${!!token}, length: ${token?.length || 0}`);
  }, [token]);

  useEffect(() => {
    // Only proceed if we have an ID and haven't already attempted a fetch
    if (!id || hasFetchAttempted) return;
    
    console.log(`🔄 ProductDetails: Effect triggered - authLoading: ${authLoading}, hasToken: ${!!token}, id: ${id}`);
    
    // Wait until auth is settled (either with or without token)
    if (authLoading) {
      console.log(`⏳ ProductDetails: Auth still loading, waiting...`);
      return;
    }
    
    // At this point, auth loading is complete - proceed with what we have
    setHasFetchAttempted(true);
    
    // If no token is available after auth loading completes
    if (!token) {
      console.log(`⚠️ ProductDetails: Auth completed but no token available`);
      setLoading(false);
      setError("Authentication required. Please log in.");
      return;
    }
    
    console.log(`✅ ProductDetails: Auth ready and token available, proceeding to fetch product`);
    
    const fetchProductDetails = async () => {
      console.log(`🔍 ProductDetails: Starting API fetch for product ${id}`);
      try {
        setLoading(true);
        setError(null);
        
        // Fix: Add more token validation
        if (!token || token.length < 10) {
          throw new Error("Invalid authentication token");
        }
        
        console.log(`🔍 ProductDetails: Sending request to ${API_URL}/api/items/get/${id}`);
        console.log(`🔑 ProductDetails: Using token: ${token.substring(0, 10)}...`);
        
        const response = await axios.get(`${API_URL}/api/items/get/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log(`✅ ProductDetails: API response received successfully`);
        
        setProduct(response.data);
        setDisplayPrice(response.data.price);
        console.log(`💰 ProductDetails: Price set to ${response.data.price}`);
      } catch (error) {
        console.error(`❌ ProductDetails: API Fetch Error:`, error?.response?.data || error.message);
        setError(error?.message || "Failed to load product details");
        Alert.alert("Error", error?.message || "Failed to load product details");
      } finally {
        console.log(`✅ ProductDetails: Fetch operation complete, setting loading to false`);
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [id, token, authLoading, hasFetchAttempted]);
  
  const calculatePrice = (period) => {
    if (!product) return 0;
    const basePrice = product.price;
    const discounts = {
      day: 1,
      week: 0.85,
      month: 0.70
    };
    return Math.round(basePrice * discounts[period]);
  };

  const handlePeriodChange = (period) => {
    console.log(`🔄 ProductDetails: Period changed to ${period}`);
    setSelectedPeriod(period);
    const newPrice = calculatePrice(period);
    console.log(`💰 ProductDetails: New price calculated: ${newPrice}`);
    setDisplayPrice(newPrice);
  };

  const handleSaveProduct = async () => {
    try {
      console.log(`🔄 ProductDetails: Toggling saved state from ${isSaved} to ${!isSaved}`);
      setIsSaved(!isSaved);
      Alert.alert(
        "Success",
        isSaved ? "Product removed from saved!" : "Product saved!"
      );
    } catch (error) {
      console.error(`❌ ProductDetails: Error saving product:`, error);
      Alert.alert("Error", "Failed to update saved status");
    }
  };

  const handleReserveProduct = () => {
    if (!product) {
      console.warn(`⚠️ ProductDetails: Cannot reserve - product is null`);
      return;
    }
    
    console.log(`🔄 ProductDetails: Navigating to ReserveProduct with productId: ${product.id}`);
    router.push({
      pathname: "/ReserveProduct",
      params: {
        productId: product.id,
        period: selectedPeriod,
        price: displayPrice,
        rentee: product.rentee
      }
    });
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image
        style={styles.productImage}
        source={{ uri: item }}
        resizeMode="contain"
      />
    </View>
  );

  // Fix: Handle auth required state
  if (!token && !authLoading && hasFetchAttempted) {
    console.log(`🔒 ProductDetails: Authentication required`);
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Authentication required. Please log in to view product details.
        </Text>
        <Button 
          title="Go to Login" 
          onPress={() => router.push('/login')} 
          color="#475FCB"
        />
      </SafeAreaView>
    );
  }

  // Render decisions with logging
  if (authLoading) {
    console.log(`⏳ ProductDetails: Showing loading state - auth is still loading`);
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Authenticating...</Text>
      </SafeAreaView>
    );
  }
  
  if (loading && !error) {
    console.log(`⏳ ProductDetails: Showing loading state - product fetch in progress`);
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </SafeAreaView>
    );
  }

  if (error || (!product && !loading)) {
    console.log(`❌ ProductDetails: Showing error state - ${error || 'Product not found'}`);
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Product not found'}
        </Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  // Only render the product when we have it
  if (!product) {
    console.log(`⚠️ ProductDetails: Product is null but no error/loading state - returning null`);
    return null;
  }

  console.log(`✅ ProductDetails: Rendering product view for ${product.title}`);
  
  // Get coordinates for the map
  const coordinates = getLocationCoordinates(product.location);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageGallery}>
          <FlatList
            data={[product.image]} // Wrap single image in array
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            horizontal
            renderItem={renderImageItem}
          />
        </View>
         
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{product.title}</Text>
            <TouchableOpacity className="bg-[#475FCB] py-2 px-4 rounded-lg self-start"
             onPress={() => {
               console.log(`🔄 ProductDetails: Navigating to ProductReview`);
               router.push('ProductReview');
             }}
            >
                <Text className="text-white font-bold">Give Review</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>
              {product.category} • {product.sub_category}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Fontisto name="date" size={14} color="white" />
            <Text style={styles.dateText}>
              {moment(product.created_at).format("MMMM D, YYYY")}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
          <View style={{height: 10}} />
          <View>
          <MapView
            style={styles.map}
            region={{
              ...coordinates,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.00421,
            }}
          >
            <Marker
              coordinate={coordinates}
              title={product.title}
            />
          </MapView>
          </View>
          <View>
          <Text style={styles.sectionTitle}>Rating and Reviews</Text>
          <Review />
        </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.priceText}>
          PKR {displayPrice}/{selectedPeriod}
        </Text>
        <View style={styles.buttonContainer}>
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              title={period.charAt(0).toUpperCase() + period.slice(1)}
              onPress={() => handlePeriodChange(period)}
              color={selectedPeriod === period ? "#475FCB" : undefined}
            />
          ))}
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

const styles = StyleSheet.create({
  categoryContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: '#161622',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  imageGallery: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '90%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  dotContainer: {
    flexDirection: 'row',
    width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 5,
    borderRadius: 5,
    marginLeft: 5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    borderColor: "red"
  },
  headerContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: 'white',
    marginLeft: 8,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 7,
  },
  description: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 10
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  bottomBar: {
    backgroundColor: '#1E1E2D',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  priceText: {
    fontSize: 22,
    color: '#475FCB',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default ProductDetails;