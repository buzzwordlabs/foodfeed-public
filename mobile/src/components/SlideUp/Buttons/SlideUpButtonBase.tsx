import Icon from "../../Primitives/Icon";
import React, { useContext } from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";

import { ThemeContext } from "../../../contexts";
import { IconLibaries } from "../../types";
import Text from "../../Primitives/Text";
import { LoadingIndicator } from "../../Primitives";

export interface Props {
  title: string;
  onPress?: (...args: any[]) => any | Promise<any>;
  IconComponent?: any;
  name?: string;
  size?: number;
  library?: IconLibaries;
  color?: string;
  style?: ViewStyle | ViewStyle[];
  loading?: boolean;
}

const SlideUpButtonBase = ({
  title,
  style,
  onPress,
  loading,
  IconComponent,
  ...props
}: Props) => {
  const { mutedText } = useContext(ThemeContext);
  return (
    <TouchableOpacity
      style={[{ paddingVertical: 20 }, style]}
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: 40,
            height: 30,
          }}
        >
          {loading ? (
            <LoadingIndicator />
          ) : (
            IconComponent || (
              // @ts-ignore
              <Icon color={mutedText} {...props} style={{ ...style }} />
            )
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text s="lg" w="bold" style={{ marginLeft: 20 }}>
            {title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SlideUpButtonBase;
