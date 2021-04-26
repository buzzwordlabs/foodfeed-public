import React, { useRef } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

interface Props {
  delay?: number;
  onPressSingle?: () => void;
  onPressDouble: () => void;
  onLongPress?: () => void;
  touchableOpacityProps?: Omit<
    TouchableOpacityProps,
    "onPress" | "onLongPress"
  >;
  style?: ViewStyle;
  children: React.ReactNode;
}

const DoubleTap = (props: Props) => {
  // time interval between double clicks
  const delayTime = props.delay || 300;
  // bool to check whether user tapped once
  const firstPress = useRef(true);
  // the last time user tapped
  const lastTime = useRef<Date | number>(new Date());
  // a timer is used to run the single tap event
  const timer: any = useRef(null);

  const onTap = () => {
    // get the instance of time when pressed
    let now = new Date().getTime();

    if (firstPress.current) {
      // set the flag indicating first press has occured
      firstPress.current = false;

      //start a timer --> if a second tap doesnt come in by the delay, trigger singleTap event handler
      timer.current = setTimeout(() => {
        //check if user passed in prop
        props.onPressSingle && props.onPressSingle();

        // reset back to initial state
        firstPress.current = true;
        timer.current = null;
      }, delayTime);

      // mark the last time of the press
      lastTime.current = now;
    } else {
      //if user pressed immediately again within span of delayTime
      if (now - (lastTime.current as number) < delayTime) {
        // clear the timeout for the single press
        timer.current && clearTimeout(timer.current);

        //check if user passed in prop for double click
        props.onPressDouble && props.onPressDouble();

        // reset back to initial state
        firstPress.current = true;
      }
    }
  };

  return (
    <TouchableOpacity
      {...props.touchableOpacityProps}
      onPress={onTap}
      onLongPress={props.onLongPress}
      style={props.style}
    >
      {props.children}
    </TouchableOpacity>
  );
};

export default DoubleTap;
