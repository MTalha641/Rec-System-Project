import React, { createContext, useState, useEffect, useReducer } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import { router } from "expo-router";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  useEffect(() => {
    console.log("🔄 AuthProvider: initializing auth state");
    const initializeAuth = async () => {
      console.log("🔍 AuthProvider: checking for stored tokens");
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");

        console.log("🔍 Stored Access Token:", storedToken ? "Found" : "Not found");
        console.log("🔍 Stored Refresh Token:", storedRefreshToken ? "Found" : "Not found");

        if (storedToken) {
          console.log("💾 AuthProvider: setting token from storage");
          setToken(storedToken);
        }
        if (storedRefreshToken) {
          console.log("💾 AuthProvider: setting refresh token from storage");
          setRefreshToken(storedRefreshToken);
        }

        if (storedToken && !isTokenExpired(storedToken)) {
          console.log("✅ AuthProvider: token is valid, fetching user details");
          await fetchUserDetails(storedToken);
        } else if (storedRefreshToken) {
          console.warn("⚠️ AuthProvider: Access token expired. Attempting to refresh...");
          await refreshAccessToken(storedRefreshToken);
        } else {
          console.warn("⚠️ AuthProvider: No valid token found. Redirecting to login.");
          logout();
        }
      } catch (error) {
        console.error("❌ AuthProvider: Failed to fetch tokens:", error);
      } finally {
        console.log("✅ AuthProvider: Auth initialization complete");
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserDetails = async (currentToken) => {
    if (!currentToken) {
      console.warn("⚠️ AuthProvider: No access token found, unable to fetch user details.");
      return;
    }

    try {
      console.log("🔍 AuthProvider: Fetching user details with token");
      const response = await axios.get(`${API_URL}/api/users/getuserdetails/`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      console.log("✅ AuthProvider: User details fetched successfully");

      setUser({
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar || "https://placekitten.com/200/200",
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn("⚠️ AuthProvider: Access token expired during user fetch. Attempting to refresh...");
        await refreshAccessToken();
      } else {
        console.error("❌ AuthProvider: Error fetching user details:", error.response?.data || error.message);
      }
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.warn("⚠️ AuthProvider: No refresh token available. Redirecting to login.");
      logout();
      return;
    }

    try {
      console.log("🔄 AuthProvider: Attempting to refresh access token");
      const response = await axios.post(
        `${API_URL}/api/users/token/refresh/`,
        { refresh: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccessToken = response.data.access;
      console.log("✅ AuthProvider: Access token successfully refreshed");

      setToken(newAccessToken);
      await AsyncStorage.setItem("accessToken", newAccessToken);
      console.log("💾 AuthProvider: New access token saved to storage");
      await fetchUserDetails(newAccessToken);
    } catch (error) {
      console.error("❌ AuthProvider: Failed to refresh token:", error.response?.data || error.message);
      logout();
    }
  };

  const login = async ({ access, refresh }) => {
    if (!access || !refresh) {
      console.warn("❌ AuthProvider: Login response is missing access or refresh tokens.");
      return;
    }

    try {
      console.log("🔑 AuthProvider: Starting login process");
      // First set loading to true to prevent premature access
      setLoading(true);
      
      // Store tokens in AsyncStorage
      console.log("💾 AuthProvider: Storing tokens in AsyncStorage");
      await AsyncStorage.setItem("accessToken", access);
      await AsyncStorage.setItem("refreshToken", refresh);
      
      // Update state
      console.log("🔄 AuthProvider: Updating token state");
      setToken(access);
      setRefreshToken(refresh);
      
      // Fetch user details
      console.log("🔍 AuthProvider: Fetching user details after login");
      await fetchUserDetails(access);
    } catch (error) {
      console.error("❌ AuthProvider: Failed to store tokens during login:", error);
    } finally {
      // Ensure loading is set to false when complete
      console.log("✅ AuthProvider: Login process complete");
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 AuthProvider: Starting logout process");
      // Set loading true during logout process
      setLoading(true);
      
      // Clear AsyncStorage
      console.log("🧹 AuthProvider: Clearing tokens from AsyncStorage");
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      
      // Clear state
      console.log("🧹 AuthProvider: Clearing authentication state");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      
      // Navigate to sign-in
      console.log("🔄 AuthProvider: Redirecting to sign-in page");
      router.replace("/sign-in");
    } catch (error) {
      console.error("❌ AuthProvider: Failed to remove tokens during logout:", error);
    } finally {
      console.log("✅ AuthProvider: Logout process complete");
      setLoading(false);
    }
  };

  console.log("🔍 AuthProvider: Current state -", { 
    hasToken: !!token, 
    hasRefreshToken: !!refreshToken, 
    hasUser: !!user, 
    isLoading: loading 
  });

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;