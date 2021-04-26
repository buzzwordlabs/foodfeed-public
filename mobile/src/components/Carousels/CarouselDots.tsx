import React from "react";
import { View } from "react-native";
import { tintColor } from "../../constants";

interface Props {
  countDots: number;
  currentIndex: number;
}

const CarouselDots = (props: Props) => {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 20,
      }}
    >
      {Array.from({ length: props.countDots }).map((_, index) => {
        const focused = props.currentIndex === index;
        const baseStyle = { marginHorizontal: 4, borderRadius: 10 };
        return props.countDots > 1 ? (
          focused ? (
            <View
              key={index}
              style={{
                ...baseStyle,
                width: 8,
                height: 8,
                backgroundColor: tintColor,
              }}
            />
          ) : (
            <View
              key={index}
              style={{
                ...baseStyle,
                width: 6.5,
                height: 6.5,
                backgroundColor: "gray",
              }}
            />
          )
        ) : (
          <View key={index} style={baseStyle} />
        );
      })}
    </View>
  );
};

export default CarouselDots;
