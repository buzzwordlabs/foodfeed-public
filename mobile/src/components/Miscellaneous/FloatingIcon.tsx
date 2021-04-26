import { Animated, Easing, Platform, ViewStyle } from "react-native";

import Icon from "../Primitives/Icon";
import React from "react";
import { window } from "../../constants";

interface Props {
  onComplete: () => void;
  style: ViewStyle;
}

interface State {
  position: any;
}

const animationEndY = Math.ceil(window.height * 0.7);
const negativeEndY = animationEndY * -1;

class FloatingIcon extends React.Component<Props, State> {
  state = {
    position: new Animated.Value(0),
  };

  componentDidMount = () => {
    this.yAnimation = this.state.position.interpolate({
      inputRange: [negativeEndY, 0],
      outputRange: [animationEndY, 0],
    });

    Animated.timing(this.state.position, {
      duration: 2000,
      toValue: negativeEndY,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(this.props.onComplete);

    this.opacityAnimation = this.yAnimation.interpolate({
      inputRange: [0, animationEndY],
      outputRange: [1, 0],
    });
  };

  getHeartStyle = () => ({
    transform: [{ translateY: this.state.position }],
    opacity: this.opacityAnimation,
  });
  yAnimation: Animated.AnimatedInterpolation | undefined;
  opacityAnimation: Animated.AnimatedInterpolation | undefined;

  render() {
    return (
      <Animated.View
        style={[
          this.getHeartStyle(),
          this.props.style,
          { position: "absolute" },
        ]}
      >
        <Icon
          library="ionicons"
          name={`${Platform.OS === "ios" ? "ios" : "md"}-thumbs-up`}
          color={"#FA5858"}
          size={40}
        />
      </Animated.View>
    );
  }
}

export default FloatingIcon;
