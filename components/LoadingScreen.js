import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image } from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      {/* Optional App Logo */}
      <Image source={require('../assets/images/RLogo.png')} style={styles.logo} resizeMode="contain" />

      {/* Loading Text */}
      <Text style={styles.text}>Getting things ready...</Text>

      {/* Spinner */}
      <ActivityIndicator size="large" color="#3498db" />
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // or your brand color
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  text: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    fontWeight: '500',
  },
});
