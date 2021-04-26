import React, { useContext } from "react";
import { ScrollView, View } from "react-native";
import { ThemeContext } from "../../../contexts";

interface Props {
  children: React.ReactNode;
}

const ModalContainer = (props: Props) => {
  const { modalBackgroundColor } = useContext(ThemeContext);
  return (
    <View style={{ justifyContent: "center", flex: 1 }}>
      <View
        style={{
          backgroundColor: modalBackgroundColor,
          marginVertical: 40,
          marginHorizontal: 20,
          minWidth: "80%",
          minHeight: "30%",
          borderRadius: 6,
          justifyContent: "center",
        }}
      >
        <ScrollView
          contentContainerStyle={{
            justifyContent: "space-between",
            flexGrow: 1,
            margin: 30,
          }}
        >
          {props.children}
        </ScrollView>
      </View>
    </View>
  );
};

export default ModalContainer;
