import {
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextInputKeyPressEventData,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";
import React, { forwardRef, useContext } from "react";

import { ThemeContext } from "../../contexts";
import Icon from "./Icon";
import SearchInput from "react-native-search-filter";
import { maxFontSizeMultiplier } from "../../constants";

interface Props {
  searchSubstring: string;
  onChangeText: (searchSubstring: string) => void | Promise<void>;
  onKeyPress?: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  style?: ViewStyle;
  onPress?: () => void;
  searchInputProps: TextInputProps;
  inputChildViewStyle?: ViewStyle;
  inputViewStyle?: ViewStyle;
}

const SearchBar = (props: Props) => {
  const { textColor, shadowBorderColor, liftedBackgroundColor } = useContext(
    ThemeContext
  );
  const {
    onChangeText,
    searchSubstring,
    style,
    onPress,
    searchInputProps,
    onKeyPress,
    inputChildViewStyle,
    inputViewStyle,
  } = props;

  const styles = StyleSheet.create({
    searchBarContainer: {
      borderRadius: 6,
      borderColor: shadowBorderColor,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: liftedBackgroundColor,
    },
    inputViewStyles: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginRight: 10,
    },
  });

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[styles.searchBarContainer, style]}>
        <SearchInput
          // ref={tref => ref = tref}
          allowFontScaling={false}
          placeholderTextColor="gray"
          placeholder="Search"
          onChangeText={(searchSubstring) => onChangeText(searchSubstring)}
          style={{
            fontSize: 16,
            color: textColor,
            fontFamily: "Muli-SemiBold",
          }}
          onKeyPress={onKeyPress}
          clearIcon={
            searchSubstring ? (
              <Icon
                library="ionicons"
                name={`${Platform.OS === "ios" ? "ios" : "md"}-close-circle`}
                size={18}
                color="gray"
              />
            ) : (
              <Icon
                library="ionicons"
                name={`${Platform.OS === "ios" ? "ios" : "md"}-search`}
                size={18}
                color="gray"
              />
            )
          }
          clearIconViewStyles={{ position: "relative" }}
          inputViewStyles={[styles.inputViewStyles, inputViewStyle ?? {}]}
          inputChildViewStyle={[
            {
              paddingHorizontal: Platform.OS === "ios" ? 10 : 0,
              paddingVertical: Platform.OS === "ios" ? 10 : 0,
            },
            inputChildViewStyle ?? {},
          ]}
          {...searchInputProps}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default SearchBar;
