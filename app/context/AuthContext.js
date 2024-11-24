import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { router } from 'expo-router';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);  // Access token
  const [refreshToken, setRefreshToken] = useState(null);  // Refresh token
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (storedToken) setToken(storedToken);
        if (storedRefreshToken) setRefreshToken(storedRefreshToken);
      } catch (error) {
        console.error('Failed to fetch tokens from storage:', error);
      }
    };
    fetchTokens();
  }, []);

  const fetchUserDetails = async () => {
    if (!token) {
      console.warn("No access token found, unable to fetch user details.");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/getuserdetails/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser({
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar || 'https://placekitten.com/200/200',
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // If token expired, try refreshing the token
        await refreshAccessToken();
      } else {
        console.error('Error fetching user details:', error.response?.data || error.message);
      }
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.warn('No refresh token available. Logging out.');
      logout();
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/users/token/refresh/`, {
        refresh: refreshToken,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const newAccessToken = response.data.access;
      setToken(newAccessToken);
      await AsyncStorage.setItem('accessToken', newAccessToken);

      // Retry fetching user details after refreshing token
      await fetchUserDetails();
    } catch (error) {
      console.error('Failed to refresh token:', error.response?.data || error.message);
      logout();
    }
  };

  const login = async (responseData) => {
    try {
      const newToken = responseData.access;  // Extract access token from response data
      const newRefreshToken = responseData.refresh;  // Extract refresh token from response data

      if (newToken) {
        await AsyncStorage.setItem('accessToken', newToken);
        setToken(newToken);
      } else {
        console.warn('Attempted to store an undefined access token');
      }

      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        setRefreshToken(newRefreshToken);
      } else {
        console.warn('Attempted to store an undefined refresh token');
      }
    } catch (error) {
      console.error('Failed to store tokens in storage:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      router.replace('/sign-in');
    } catch (error) {
      console.error('Failed to remove tokens from storage:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserDetails();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
