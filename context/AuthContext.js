import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { router } from 'expo-router';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null); // Access token
  const [refreshToken, setRefreshToken] = useState(null); // Refresh token
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state

  // Utility function to check if the token is expired
  const isTokenExpired = (token) => {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
    const expirationTime = payload.exp * 1000; // exp is in seconds, convert to ms
    return Date.now() > expirationTime;
  };

  // Fetch stored tokens on app load
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

        if (storedToken) {
          setToken(storedToken);
        }
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }

        if (storedToken && !isTokenExpired(storedToken)) {
          await fetchUserDetails(storedToken);
        } else {
          console.warn('Access token expired or missing. Attempting to refresh...');
          await refreshAccessToken();
        }
      } catch (error) {
        console.error('Failed to fetch tokens from storage:', error);
      } finally {
        setLoading(false); // Set loading to false once token fetching is complete
      }
    };

    fetchTokens();
  }, []);

  // Fetch user details using access token
  const fetchUserDetails = async (currentToken) => {
    if (!currentToken) {
      console.warn('No access token found, unable to fetch user details.');
      return;
    }

    try {
      console.log("Fetching user details with token:", currentToken.substring(0, 10) + "...");
      
      // Add cache-busting timestamp to prevent stale data
      const timestamp = new Date().getTime();
      const response = await axios.get(`${API_URL}/api/users/getuserdetails/?_t=${timestamp}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      });

      console.log("Raw API Response:", response.data);

      if (!response.data) {
        console.error("No data received from API");
        return;
      }

      // Create user object with the data from API
      const userData = {
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        full_name: response.data.full_name || response.data.username,
        userType: response.data.userType || response.data.user_type || "Normal User",
        interests: response.data.interests || [],
      };

      console.log("Processed User Data:", userData);
      console.log("User Type:", userData.userType); // Add this for debugging

      if (!userData.id) {
        console.error("No user ID found in response:", response.data);
        return;
      }

      // Store user type in AsyncStorage for easy retrieval
      await AsyncStorage.setItem("userType", userData.userType || "Normal User");
      await AsyncStorage.setItem("currentUserId", userData.id.toString());
      await AsyncStorage.setItem("currentUsername", userData.username);
      
      setUser(userData);
    } catch (error) {
      console.error("Error in fetchUserDetails:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        console.warn('Access token expired. Attempting to refresh...');
        await refreshAccessToken();
      } else {
        console.error('Error fetching user details:', error.response?.data || error.message);
      }
    }
  };

  // Refresh the access token if it has expired
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.warn('No refresh token available. Redirecting to login.');
      logout();
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/users/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const newAccessToken = response.data.access;
      setToken(newAccessToken);
      await AsyncStorage.setItem('accessToken', newAccessToken);

      // Retry fetching user details after refreshing token
      await fetchUserDetails(newAccessToken);
    } catch (error) {
      console.error('Failed to refresh token:', error.response?.data || error.message);
      logout();
    }
  };

  // Login and store tokens
  const login = async ({ access, refresh }) => {
    if (!access || !refresh) {
      console.warn('Login response is missing access or refresh tokens.');
      return;
    }

    try {
      console.log("Storing tokens and fetching user details...");
      await AsyncStorage.setItem('accessToken', access);
      await AsyncStorage.setItem('refreshToken', refresh);
      setToken(access);
      setRefreshToken(refresh);

      // Fetch user details after storing tokens
      await fetchUserDetails(access);
    } catch (error) {
      console.error('Failed to store tokens during login:', error);
    }
  };

  // Logout and clear tokens
  const logout = async () => {
    try {
      // Clear all auth-related items from AsyncStorage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userType');
      await AsyncStorage.removeItem('currentUserId');
      await AsyncStorage.removeItem('currentUsername');
      
      // Force clear the user state immediately
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      
      // Add a small delay before navigation to ensure state is cleared
      setTimeout(() => {
        router.replace('/sign-in');
      }, 100);
    } catch (error) {
      console.error('Failed to remove tokens during logout:', error);
      // Still attempt to navigate even if there was an error
      router.replace('/sign-in');
    }
  };

  // Automatically fetch user details when token changes
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      fetchUserDetails(token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;