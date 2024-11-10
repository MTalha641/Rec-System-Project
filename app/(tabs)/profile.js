import React, { useContext } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { AuthContext } from "../context/AuthContext";
// import {  router } from "expo-router";
const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <Text style={styles.username}>Welcome, {user.username}!</Text>
      <Text style={styles.email}>Your email,{user.email}</Text>
      
      <Button title="Logout" onPress={logout}
     
      
       color="#f05454" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
});

export default Profile;
