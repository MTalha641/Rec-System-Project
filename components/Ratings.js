import React from "react";
import { View, Text } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const Ratings = ({ value, text, total }) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <FontAwesome
        name={value >= 1 ? "star" : value >= 0.5 ? "star-half-o" : "star-o"}
        color={"#EC8932"}
        size={16}
      />
      <FontAwesome
        name={value >= 2 ? "star" : value >= 1.5 ? "star-half-o" : "star-o"}
        color={"#EC8932"}
        size={16}
      />
      <FontAwesome
        name={value >= 3 ? "star" : value >= 2.5 ? "star-half-o" : "star-o"}
        color={"#EC8932"}
        size={16}
      />
      <FontAwesome
        name={value >= 4 ? "star" : value >= 3.5 ? "star-half-o" : "star-o"}
        color={"#EC8932"}
        size={16}
      />
      <FontAwesome
        name={value >= 5 ? "star" : value >= 4.5 ? "star-half-o" : "star-o"}
        color={"#EC8932"}
        size={16}
      />
      <Text style={{ marginLeft: 4 }}>
        {text} {total >= 0 && <Text>{"(" + total + ")"}</Text>}
      </Text>
    </View>
  );
};

export default Ratings;