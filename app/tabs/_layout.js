import { Text, View, Image } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { icons } from "../../constants";
import { AuthProvider } from "../context/AuthContext";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        height: 60, // Ensure the icon and text fit within the tab bar height
        marginTop: 18
      }}
    >
      <Image
        source={icon}
        resizeMode="contain"
        style={{
          tintColor: color,
          width: 24,
          height: 24,
          marginBottom: 2, // Minimized gap between icon and text
        }}
      />
      <Text
        style={{
          color: color,
          fontSize: 12, // Font size for the text
          fontWeight: focused ? "600" : "400", // Bold for focused state
          textAlign: "center",
          width: 60, // Ensure enough width for long text
          overflow: "hidden", // Avoid any text overflow
        }}
      >
        {name}
      </Text>
    </View>
  );
};

const Tabslayout = () => {
  return (
    <AuthProvider>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#ffa001",
          tabBarInactiveTintColor: "#cdcde0",
          tabBarStyle: {
          backgroundColor: "#161622", // Tab bar background color
          borderTopWidth: 1,
          borderTopColor: "#ffa001",
          height: 60, // Adjusted height to fit icon and text properly
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.home} color={color} name="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookmark"
          options={{
            title: "Bookmark",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.bookmark} color={color} name="Bookmark" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.plus} color={color} name="Create" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.profile} color={color} name="Profile" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </AuthProvider>
  );
};

export default Tabslayout;
