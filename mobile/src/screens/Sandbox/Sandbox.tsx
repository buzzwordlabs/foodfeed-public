import React, { useContext } from "react";
import { ThemeContext } from "../../contexts";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { statusBarHeight, tintColor } from "../../constants";
import { Text, Button } from "../../components";
import { BadgeContext } from "../../contexts/BadgeContext";
import { PostReactionsStringIndexed } from "../../utils";
import { ConversationMessageReaction } from "../Conversations/Conversation";
import { useModal } from "../../hooks";

interface Props {}

interface State {}

const initialState: State = {};

const Sandbox = (props: Props) => {
  const { backgroundColor } = useContext(ThemeContext);
  const { openModal, closeModal } = useModal();
  return (
    <View
      style={{ flex: 1, backgroundColor, paddingTop: statusBarHeight }}
    ></View>
  );
};

export default Sandbox;
