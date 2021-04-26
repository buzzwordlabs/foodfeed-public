import React, { useContext } from "react";
import { View, TouchableOpacity } from "react-native";
import { ThemeContext } from "../../contexts";
import { Text, ParentView, Icon } from "../../components";
import { CreateStackNavProps } from "../../navigation";
import { tintColor, errorColor, shadowBox } from "../../constants";
import { IconLibaries } from "../../components/types";
import LinearGradient from "react-native-linear-gradient";
import { useNavigationLock } from "../../hooks";

const CreateRoot = (props: CreateStackNavProps<"CreateRoot">) => {
  const [locker] = useNavigationLock();
  return (
    <ParentView style={{ flex: 1 }} noHeader noHorizontalPadding>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 20,
          paddingRight: 10,
          paddingBottom: 10,
        }}
      >
        <Text s="header" w="bold">
          Create
        </Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <CreationButton
          onPress={() =>
            locker() &&
            props.navigation.push("CreateLiveStream", { canGoBack: true })
          }
          library="antdesign"
          name="videocamera"
          title="Stream 🧑‍🍳 🍲"
          description="Live stream yourself eating or cooking food"
          gradientColors={[errorColor, tintColor, "#F9D423"]}
        />
        <CreationButton
          onPress={() => locker() && props.navigation.push("CallsRoot")}
          name="phone"
          library="antdesign"
          title="Call 📱🌎"
          description="Get paired up with someone new to video chat with"
          gradientColors={["#52c234", "#00F260", "#56CCF2", "#0575E6"]}
        />
        <CreationButton
          onPress={() =>
            locker() && props.navigation.push("CreatePostUploadMedia")
          }
          library="antdesign"
          name="form"
          title={`Post 📷 😍`}
          description="Share delicious pictures of your delicious food"
          gradientColors={["#833ab4", "#fd1d1d", "#fcb045"]}
        />
      </View>
    </ParentView>
  );
};

interface CreationButtonProps {
  title: string;
  onPress: () => void;
  library: IconLibaries;
  name: string;
  description: string;
  gradientColors: string[];
}

const CreationButton = (props: CreationButtonProps) => {
  const { focusedActionButtonTextColor } = useContext(ThemeContext);

  return (
    <TouchableOpacity onPress={props.onPress}>
      <LinearGradient
        colors={props.gradientColors}
        style={{
          width: "100%",
          alignSelf: "center",
          marginTop: 20,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 30,
          paddingHorizontal: 30,
          height: 150,
        }}
        useAngle
        angle={45}
        angleCenter={{ x: 0.5, y: 0.5 }}
      >
        <View>
          <Icon
            style={{ ...shadowBox }}
            library={props.library}
            name={props.name}
            size={50}
            color={focusedActionButtonTextColor}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 30 }}>
          <Text style={{ color: "white", ...shadowBox }} s="subHeader" w="bold">
            {props.title}
          </Text>
          <Text style={{ color: "white", ...shadowBox }} s="lg" w="bold">
            {props.description}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default CreateRoot;
