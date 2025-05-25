import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { router } from 'expo-router';
import axios from 'axios';
import LoadingScreen from '../components/LoadingScreen';

export const AuthContext = createContext();

// Cache decoded JWT payloads to avoid repeated decoding
const tokenPayloadCache = new Map();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Prevent multiple simultaneous refresh attempts
  const refreshPromiseRef = useRef(null);
  const userFetchPromiseRef = useRef(null);
  const initPromiseRef = useRef(null);

  // Optimized token expiration check with caching
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    
    try {
      // Check cache first
      if (tokenPayloadCache.has(token)) {
        const payload = tokenPayloadCache.get(token);
        return Date.now() > payload.exp * 1000;
      }
      
      // Decode and cache
      const payload = JSON.parse(atob(token.split('.')[1]));
      tokenPayloadCache.set(token, payload);
      
      return Date.now() > payload.exp * 1000;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }, []);

  // Enhanced token validation
  const isValidTokenFormat = useCallback((token) => {
    if (!token) return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Try to decode the payload
      JSON.parse(atob(parts[1]));
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }, []);

  // Batch AsyncStorage operations for better performance
  const getStoredTokens = useCallback(async () => {
    try {
      const [storedToken, storedRefreshToken] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('refreshToken')
      ]);
      return { storedToken, storedRefreshToken };
    } catch (error) {
      console.error('Failed to fetch tokens from storage:', error);
      return { storedToken: null, storedRefreshToken: null };
    }
  }, []);

  // Clear invalid tokens from storage
  const clearTokens = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('refreshToken'),
        AsyncStorage.removeItem('userType'),
        AsyncStorage.removeItem('currentUserId'),
        AsyncStorage.removeItem('currentUsername')
      ]);
      tokenPayloadCache.clear();
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }, []);

  // Optimized user details fetching with deduplication
  const fetchUserDetails = useCallback(async (currentToken) => {
    if (!currentToken || !isValidTokenFormat(currentToken) || isTokenExpired(currentToken)) {
      console.warn('Token is missing, invalid, or expired');
      return false;
    }

    // Prevent multiple simultaneous user fetch requests
    if (userFetchPromiseRef.current) {
      return userFetchPromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
        console.log("Fetching user details...");
        
        const response = await axios.get(`${API_URL}/api/users/getuserdetails/`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          timeout: 10000,
        });

        if (!response.data?.id) {
          console.error("Invalid user data received");
          return false;
        }

        // Process user data
        const userData = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          full_name: response.data.full_name || response.data.username,
          userType: response.data.userType || response.data.user_type || "Normal User",
          interests: response.data.interests || [],
        };

        console.log("User authenticated:", userData.username);

        // Batch AsyncStorage writes
        await Promise.all([
          AsyncStorage.setItem("userType", userData.userType),
          AsyncStorage.setItem("currentUserId", userData.id.toString()),
          AsyncStorage.setItem("currentUsername", userData.username)
        ]);
        
        setUser(userData);
        return true;
      } catch (error) {
        console.error("Error fetching user details:", error.message);
        
        if (error.response?.status === 401) {
          console.warn('Token expired during user fetch');
          return false;
        }
        
        // For other errors, don't throw to prevent initialization failure
        console.error('User fetch failed, but continuing initialization');
        return false;
      } finally {
        userFetchPromiseRef.current = null;
      }
    })();

    userFetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [isTokenExpired, isValidTokenFormat]);

  // Token refresh function that works with stored tokens
  const performTokenRefresh = useCallback(async (refreshTokenToUse) => {
    if (!refreshTokenToUse || !isValidTokenFormat(refreshTokenToUse)) {
      console.warn('Invalid refresh token provided');
      await clearTokens();
      return null;
    }

    try {
      console.log('Refreshing access token...');
      
      const response = await axios.post(
        `${API_URL}/api/users/token/refresh/`,
        { refresh: refreshTokenToUse },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const newAccessToken = response.data.access;
      
      if (!newAccessToken || !isValidTokenFormat(newAccessToken)) {
        console.error('Invalid access token received from refresh');
        await clearTokens();
        return null;
      }
      
      // Clear cache for old token
      if (token) tokenPayloadCache.delete(token);
      
      // Update state and storage atomically
      setToken(newAccessToken);
      await AsyncStorage.setItem('accessToken', newAccessToken);

      console.log('Token refreshed successfully');
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('Refresh token is expired or invalid');
      } else if (error.response?.status === 500) {
        console.error('Server error during token refresh');
      }
      
      // Clear invalid tokens
      await clearTokens();
      return null;
    }
  }, [token, isValidTokenFormat, clearTokens]);

  // Main initialization function
  const initializeAuth = useCallback(async () => {
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    const initPromise = (async () => {
      try {
        console.log('Starting auth initialization...');
        const { storedToken, storedRefreshToken } = await getStoredTokens();
        
        console.log('Stored tokens found:', {
          hasAccessToken: !!storedToken,
          hasRefreshToken: !!storedRefreshToken,
          accessTokenValid: storedToken ? isValidTokenFormat(storedToken) : false,
          accessTokenExpired: storedToken ? isTokenExpired(storedToken) : true,
          refreshTokenValid: storedRefreshToken ? isValidTokenFormat(storedRefreshToken) : false
        });

        // Validate token formats first
        const validAccessToken = storedToken && isValidTokenFormat(storedToken);
        const validRefreshToken = storedRefreshToken && isValidTokenFormat(storedRefreshToken);

        if (!validAccessToken && !validRefreshToken) {
          console.log('No valid tokens found, clearing storage');
          await clearTokens();
          setInitialized(true);
          return;
        }

        if (validAccessToken && !isTokenExpired(storedToken)) {
          // Valid access token exists
          console.log('Valid access token found');
          setToken(storedToken);
          if (validRefreshToken) {
            setRefreshToken(storedRefreshToken);
          }
          
          const userFetched = await fetchUserDetails(storedToken);
          if (!userFetched && validRefreshToken) {
            // User fetch failed, try refreshing token
            console.log('User fetch failed, attempting refresh...');
            const newToken = await performTokenRefresh(storedRefreshToken);
            if (newToken) {
              await fetchUserDetails(newToken);
            }
          }
        } else if (validRefreshToken) {
          // Access token expired/missing but refresh token exists
          console.log('Access token expired/missing, attempting refresh...');
          setRefreshToken(storedRefreshToken);
          
          const newToken = await performTokenRefresh(storedRefreshToken);
          if (newToken) {
            await fetchUserDetails(newToken);
          }
        } else {
          // Clear invalid tokens
          console.log('Invalid tokens found, clearing storage');
          await clearTokens();
        }
        
        setInitialized(true);
        console.log('Auth initialization completed');
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Ensure we're always initialized even on error
        await clearTokens();
        setInitialized(true);
      } finally {
        setLoading(false);
        initPromiseRef.current = null;
      }
    })();

    initPromiseRef.current = initPromise;
    return initPromise;
  }, [getStoredTokens, isTokenExpired, isValidTokenFormat, fetchUserDetails, performTokenRefresh, clearTokens]);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Optimized token refresh with deduplication (for use after init)
  const refreshAccessToken = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    if (!refreshToken || !isValidTokenFormat(refreshToken)) {
      console.warn('No valid refresh token available');
      logout();
      return null;
    }

    refreshPromiseRef.current = performTokenRefresh(refreshToken);
    const result = await refreshPromiseRef.current;
    refreshPromiseRef.current = null;
    
    return result;
  }, [refreshToken, performTokenRefresh, isValidTokenFormat]);

  // Get valid token function for API calls
  const getValidToken = useCallback(async () => {
    // Wait for initialization to complete
    if (!initialized) {
      console.log('Waiting for auth initialization...');
      await initializeAuth();
    }

    // Check current token
    if (token && isValidTokenFormat(token) && !isTokenExpired(token)) {
      return token;
    }

    // Try to refresh if we have refresh token
    if (refreshToken && isValidTokenFormat(refreshToken)) {
      console.log('Token expired/invalid, refreshing...');
      const newToken = await refreshAccessToken();
      return newToken;
    }

    console.warn('No valid token available');
    return null;
  }, [initialized, token, refreshToken, isTokenExpired, isValidTokenFormat, refreshAccessToken, initializeAuth]);

  // Optimized login function
  const login = useCallback(async ({ access, refresh }) => {
    if (!access || !refresh || !isValidTokenFormat(access) || !isValidTokenFormat(refresh)) {
      console.warn('Missing or invalid access/refresh tokens in login response');
      return false;
    }

    try {
      console.log("Processing login...");
      
      // Clear old caches
      tokenPayloadCache.clear();
      
      // Store tokens
      await Promise.all([
        AsyncStorage.setItem('accessToken', access),
        AsyncStorage.setItem('refreshToken', refresh)
      ]);
      
      // Update state
      setToken(access);
      setRefreshToken(refresh);

      // Fetch user details
      const success = await fetchUserDetails(access);
      if (success) {
        console.log("Login successful");
        setInitialized(true);
      }
      
      return success;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, [fetchUserDetails, isValidTokenFormat]);

  // Optimized logout function
  const logout = useCallback(async () => {
    try {
      console.log("Logging out...");
      
      // Clear all caches and promises
      tokenPayloadCache.clear();
      refreshPromiseRef.current = null;
      userFetchPromiseRef.current = null;
      initPromiseRef.current = null;
      
      // Clear state
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setInitialized(false);
      setLoading(false);
      
      // Clear storage
      await clearTokens();
      
      // Navigate
      router.replace('/sign-in');
      
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/sign-in');
    }
  }, [clearTokens]);

  // Memoized context value
  const contextValue = React.useMemo(() => ({
    token,
    user,
    login,
    logout,
    loading,
    initialized,
    getValidToken,
    isAuthenticated: initialized && !!token && !!user && isValidTokenFormat(token) && !isTokenExpired(token)
  }), [token, user, login, logout, loading, initialized, getValidToken, isTokenExpired, isValidTokenFormat]);

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : <LoadingScreen />}
    </AuthContext.Provider>
  );
};
