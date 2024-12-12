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
      const response = await axios.get(`${API_URL}/api/users/getuserdetails/`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      setUser({
        username: response.data.username,
        email: response.data.email,
        avatar: response.data.avatar || 'https://placekitten.com/200/200',
      });
    } catch (error) {
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
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      router.replace('/sign-in');
    } catch (error) {
      console.error('Failed to remove tokens during logout:', error);
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