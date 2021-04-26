import RawSelect, { PickerSelectProps } from "react-native-picker-select";
import React, { useContext } from "react";
import { errorColor, successColor, tintColor } from "../../constants";

import { ThemeContext } from "../../contexts";
import Icon from "./Icon";
import { View } from "react-native";

interface Props extends PickerSelectProps {
  changeCurrentFocused: (newFocus: string) => void;
  currentFocused: string;
  label: string;
  showCheckbox: boolean;
}

const Select = (props: Props) => {
  const { borderColor, textColor } = useContext(ThemeContext);
  const { changeCurrentFocused, currentFocused, label } = props;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: currentFocused === label ? tintColor : borderColor,
        height: 50,
        borderRadius: 8,
        marginVertical: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1 }}>
        <RawSelect
          onOpen={() => changeCurrentFocused(label)}
          onClose={() => changeCurrentFocused("")}
          style={{
            inputIOS: {
              fontFamily: "Muli-Bold",
              fontSize: 16,
              color: textColor,
              padding: 10,
            },
            inputAndroid: {
              fontFamily: "Muli",
              fontSize: 16,
              color: textColor,
              padding: 10,
            },
          }}
          {...props}
        />
      </View>
      <View style={{ alignSelf: "center", marginRight: 10 }}>
        {props.value === "placeholder" ? null : !props.showCheckbox ? (
          <Icon library="feather" name="x" color={errorColor} size={18} />
        ) : (
          <Icon
            library="materialComIcons"
            name="check"
            color={successColor}
            size={18}
          />
        )}
      </View>
    </View>
  );
};

export default Select;
