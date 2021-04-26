import {
  PlaceholderContainer,
  PlaceholderLine,
  PlaceholderMedia,
} from "../Placeholder";
import React, { useContext } from "react";
import { TouchableOpacity, View } from "react-native";

import { Avatar } from "../Miscellaneous";
import { ThemeContext } from "../../contexts";
import Text from "../Primitives/Text";
import { shadowBox, successColor } from "../../constants";

export interface ProfileItemUserInfo {
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isOnline: boolean | undefined;
}

export type OnPressProfileItem = (
  user: ProfileItemUserInfo
) => Promise<any> | any;

export interface ProfileItemProps extends ProfileItemUserInfo {
  RightAlignedComponent?: any;
  onPress: OnPressProfileItem;
  activeOpacity?: number;
}

const ProfileItem = (props: ProfileItemProps) => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  const {
    username,
    firstName,
    lastName,
    isOnline,
    onPress,
    avatar,
    activeOpacity,
    RightAlignedComponent,
  } = props;
  const ProfileItemuserInfo: ProfileItemUserInfo = {
    username,
    firstName,
    lastName,
    avatar,
    isOnline,
  };
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: liftedBackgroundColor,
        ...shadowBox,
        marginTop: 10,
      }}
      onPress={() => {
        onPress ? onPress(ProfileItemuserInfo) : null;
      }}
      activeOpacity={activeOpacity}
    >
      <View>
        <Avatar style={{ width: 40, height: 40 }} avatar={avatar} />
        {isOnline !== undefined && (
          <View
            style={{
              width: 12.5,
              height: 12.5,
              borderRadius: 10,
              backgroundColor: isOnline ? successColor : "gray",
              position: "absolute",
              top: 0,
              right: -2.5,
            }}
          />
        )}
      </View>
      <View
        style={[
          {
            flex: 1,
            flexDirection: "row",
            marginLeft: 20,
            paddingVertical: 15,
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text w="semiBold">{username}</Text>
          <Text
            w="semiBold"
            t="muted"
            s="sm"
          >{`${firstName} ${lastName}`}</Text>
        </View>
        <View style={{ justifyContent: "center" }}>
          {RightAlignedComponent}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProfileItemPlaceholder = () => {
  const { liftedBackgroundColor } = useContext(ThemeContext);
  return (
    <PlaceholderContainer
      Left={() => (
        <PlaceholderMedia isRound style={{ marginRight: 10 }} size={40} />
      )}
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: liftedBackgroundColor,
        marginTop: 10,
        paddingVertical: 15,
      }}
    >
      <PlaceholderLine width={50} height={7.5} />
      <PlaceholderLine width={40} height={7.5} />
    </PlaceholderContainer>
  );
};

export { ProfileItem, ProfileItemPlaceholder };
