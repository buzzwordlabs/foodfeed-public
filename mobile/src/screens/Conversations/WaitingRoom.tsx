import * as Animatable from "react-native-animatable";
import {
  AMPLITUDE_TRANSACTIONAL_EVENTS,
  amplitudeTrack,
  showBanner,
  getSearchingGif,
  getWaitingGif,
} from "../../utils";
import {
  Button,
  CallFeedbackSlideUp,
  ParentView,
  Text,
  Avatar,
  PermissionsSlideUp,
} from "../../components";
import { View } from "react-native";
import React, { useContext, useEffect, useState, useRef } from "react";

import { CallContext } from "../../contexts";
import {
  ConversationsStackNavProps,
  CreateStackNavProps,
} from "../../navigation";
import { useSlideUp, usePermissionStatus } from "../../hooks";
import { errorColor, tintColor, fadedTintColor } from "../../constants";
import { useIsFocused } from "@react-navigation/native";
import FastImage from "react-native-fast-image";

type Props = CreateStackNavProps<"WaitingRoom">;

type State = {
  acceptPotentialCallTimerDuration: number;
};

const initialState: State = {
  acceptPotentialCallTimerDuration: 0,
};

const acceptPotentialCallTimeLimit = 10000;

const WaitingRoom = (props: Props) => {
  const callContext = useContext(CallContext);
  const [state, setState] = useState(initialState);

  const [feedbackRef, openFeedbackSlideUp, closeFeedbackSlideUp] = useSlideUp();
  const potentialCallTimerRef: any = useRef(0);
  const remoteDeniedCallTimerRef: any = useRef(0);
  const pollingSetIntervalRef: any = useRef(null);
  const pollingCounterRef: any = useRef(0);

  useEffect(() => {
    callContext.joinedWaitingRoom();
    amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.join_waiting_room);
    return () => {
      const { localPotentialCallStatus } = callContext.getState();
      if (
        localPotentialCallStatus === "local_deciding" ||
        localPotentialCallStatus === "waiting_for_remote"
      ) {
        onPressDeny();
      }
      stopPolling();
      callContext.leaveWaitingRoom();
    };
  }, []);

  useEffect(() => {
    if (callContext.state.showCallFeedbackSlideUp) {
      openFeedbackSlideUp();
    } else {
      closeFeedbackSlideUp();
    }
  }, [callContext.state.showCallFeedbackSlideUp]);

  useEffect(() => {
    switch (callContext.state.localPotentialCallStatus) {
      case "searching_for_match":
        setupPolling();
        callContext.findUsersToCall();
        break;
      case "local_deciding":
        stopPolling();
        startPotentialCallTimer();
        break;
    }
  }, [callContext.state.localPotentialCallStatus]);

  useEffect(() => {
    switch (callContext.state.remotePotentialCallStatus) {
      case "remote_accepted_call":
        stopPolling();
        if (
          callContext.state.localPotentialCallStatus === "waiting_for_remote"
        ) {
          props.navigation.push("Call");
        }
        break;
      case "remote_denied_call":
        stopPolling();
        stopPotentialCallTimer();
        break;
      case "unknown":
        break;
    }
  }, [callContext.state.remotePotentialCallStatus]);

  const setupPolling = () => {
    clearInterval(pollingSetIntervalRef.current);
    pollingSetIntervalRef.current = setInterval(() => {
      if (!callContext.getCallPresent() && pollingCounterRef.current < 10) {
        callContext.findUsersToCall();
        pollingCounterRef.current++;
      } else {
        clearInterval(pollingSetIntervalRef.current);
        if (pollingCounterRef.current >= 10 && !callContext.getCallPresent()) {
          showBanner({
            message: `Sorry, no calls are available.`,
            description: "Please try again later.",
          });
          callContext.cleanup();
          props.navigation.goBack();
        }
      }
    }, 3000);
  };

  const stopPolling = () => {
    clearInterval(pollingSetIntervalRef.current);
  };

  const closeCallFeedbackModal = () => {
    if (callContext.state.callId) {
      callContext.setState({ callId: "" });
    }
    callContext.resetFeedbackState();
  };

  const onGoBack = () => {
    props.navigation.goBack();
  };

  useEffect(() => {
    if (
      state.acceptPotentialCallTimerDuration >= acceptPotentialCallTimeLimit
    ) {
      onPressDeny();
    }
  }, [state.acceptPotentialCallTimerDuration]);

  const startPotentialCallTimer = () => {
    stopPotentialCallTimer();
    potentialCallTimerRef.current = setInterval(() => {
      setState(({ acceptPotentialCallTimerDuration }) => ({
        ...state,
        acceptPotentialCallTimerDuration:
          acceptPotentialCallTimerDuration + 1000,
      }));
    }, 1000);
  };

  const stopPotentialCallTimer = () => {
    clearInterval(potentialCallTimerRef.current);
    setState({ ...state, acceptPotentialCallTimerDuration: 0 });
  };

  const onPressDeny = () => {
    stopPotentialCallTimer();
    callContext.callRejected();
  };

  const onPressAccept = () => {
    stopPotentialCallTimer();
    callContext.callAccepted();
    if (
      callContext.state.remotePotentialCallStatus === "remote_accepted_call"
    ) {
      props.navigation.push("Call");
    } else if (
      callContext.state.remotePotentialCallStatus === "remote_denied_call"
    ) {
      remoteDeniedCallTimerRef.current = setTimeout(() => {
        callContext.setState({
          localPotentialCallStatus: "searching_for_match",
        });
      }, 3000);
    } else {
      callContext.setState({ localPotentialCallStatus: "waiting_for_remote" });
    }
  };

  const onPressOkayForRemoteDenied = () => {
    clearInterval(remoteDeniedCallTimerRef.current);
    callContext.rejoinWaitingRoom();
    callContext.setState({
      localPotentialCallStatus: "searching_for_match",
      remotePotentialCallStatus: "unknown",
    });
  };

  return (
    <ParentView style={{ flex: 1 }}>
      <UIManager
        acceptPotentialCallTimerDuration={
          state.acceptPotentialCallTimerDuration
        }
        onPressOkayForRemoteDenied={onPressOkayForRemoteDenied}
        onPressAccept={onPressAccept}
        onPressDeny={onPressDeny}
      />
      <CallFeedbackSlideUp
        ref={feedbackRef}
        onClose={closeCallFeedbackModal}
        onSubmit={closeCallFeedbackModal}
      />
    </ParentView>
  );
};

interface UIManagerProps {
  acceptPotentialCallTimerDuration: number;
  onPressAccept: () => void;
  onPressDeny: () => void;
  onPressOkayForRemoteDenied: () => void;
}

const UIManager = ({
  acceptPotentialCallTimerDuration,
  onPressOkayForRemoteDenied,
  onPressAccept,
  onPressDeny,
}: UIManagerProps) => {
  const callContext = useContext(CallContext);

  if (callContext.state.remotePotentialCallStatus === "remote_denied_call") {
    return (
      <View style={{ flex: 1, justifyContent: "center", marginBottom: 50 }}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <RemoteAvatar avatarURI={callContext.state.remoteUserInfo.avatar} />
        </View>
        <Text s="xl" w="extraBold" a="center">
          Sorry, {callContext.state.remoteUserInfo.username} didn't answer the
          call.
        </Text>
        <Text s="xl" w="extraBold" a="center">
          But don't worry, we'll connect you to someone new!
        </Text>
        <Button
          style={{ marginTop: 40 }}
          title="Okay"
          onPress={onPressOkayForRemoteDenied}
        />
      </View>
    );
  }

  if (callContext.state.localPotentialCallStatus === "searching_for_match") {
    return (
      <View>
        <Text s="header" w="bold">
          {callContext.state.numOnlineUsers} Online
        </Text>
        <Text s="lg" w="bold" style={{ marginTop: 10 }}>
          We'll try to connect you to someone with shared interests.
        </Text>
        <Gif type="searching" />
        <View>
          <Text s="xl" w="bold" a="center">
            Looking for someone with shared interests...
          </Text>
        </View>
      </View>
    );
  }

  if (callContext.state.localPotentialCallStatus === "waiting_for_remote") {
    return (
      <View>
        <View style={{ alignItems: "center" }}>
          <RemoteAvatar avatarURI={callContext.state.remoteUserInfo.avatar} />
        </View>
        <Text style={{ marginTop: 20 }} a="center" w="extraBold" s="xl">
          {callContext.state.remoteUserInfo.username}
        </Text>
        {(callContext.state.remoteUserInfo.isFollowing ||
          callContext.state.remoteUserInfo.isFollower) && (
          <View
            style={{
              backgroundColor: fadedTintColor,
              alignSelf: "center",
              marginHorizontal: 10,
              marginTop: 20,
              paddingVertical: 5,
              paddingHorizontal: 10,
              borderRadius: 6,
            }}
          >
            <Text>
              {callContext.state.remoteUserInfo.isFollowing
                ? callContext.state.remoteUserInfo.isFollower
                  ? "Following each other"
                  : "You're following them"
                : callContext.state.remoteUserInfo.isFollower &&
                  "Following you"}
            </Text>
          </View>
        )}

        <Gif type="waiting" />
        <Text s="xl" w="bold" a="center">
          Waiting for {callContext.state.remoteUserInfo.username} to accept
          too...
        </Text>
      </View>
    );
  }

  if (callContext.state.localPotentialCallStatus === "local_deciding") {
    return (
      <Animatable.View animation="fadeInRight" duration={500}>
        <View style={{ marginVertical: 40 }}>
          <Text
            a="center"
            s="header"
            w="extraBold"
            style={{ marginBottom: 30 }}
          >
            {(acceptPotentialCallTimeLimit - acceptPotentialCallTimerDuration) /
              1000}
          </Text>
          <View style={{ alignItems: "center" }}>
            <RemoteAvatar
              avatarURI={callContext.state.remoteUserInfo.avatar}
              pulsating
            />
          </View>
          <Text style={{ marginTop: 20 }} a="center" w="extraBold" s="xl">
            {callContext.state.remoteUserInfo.username}
          </Text>
          {(callContext.state.remoteUserInfo.isFollowing ||
            callContext.state.remoteUserInfo.isFollower) && (
            <View
              style={{
                backgroundColor: fadedTintColor,
                alignSelf: "center",
                marginHorizontal: 10,
                marginTop: 20,
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 6,
              }}
            >
              <Text>
                {callContext.state.remoteUserInfo.isFollowing
                  ? callContext.state.remoteUserInfo.isFollower
                    ? "Following each other"
                    : "You're following them"
                  : callContext.state.remoteUserInfo.isFollower &&
                    "Following you"}
              </Text>
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <Button
            style={{ flex: 1, marginHorizontal: 10 }}
            onPress={onPressAccept}
            title="Accept"
          />
          <Button
            style={{
              flex: 1,
              marginHorizontal: 10,
              borderColor: errorColor,
            }}
            textStyle={{ color: errorColor }}
            outline
            onPress={onPressDeny}
            title="Deny"
          />
        </View>
      </Animatable.View>
    );
  }

  return <></>;
};

type RemoteAvatarProps = { pulsating?: boolean; avatarURI: string };

const RemoteAvatar = React.memo(({ pulsating, avatarURI }: RemoteAvatarProps) =>
  pulsating ? (
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      duration={1000}
      style={{
        borderRadius: 80,
        borderWidth: 3,
        padding: 5,
        borderColor: tintColor,
      }}
    >
      <Avatar style={{ width: 80, height: 80 }} avatar={avatarURI} />
    </Animatable.View>
  ) : (
    <View
      style={{
        borderRadius: 80,
        borderWidth: 3,
        padding: 5,
        borderColor: tintColor,
      }}
    >
      <Avatar style={{ width: 80, height: 80 }} avatar={avatarURI} />
    </View>
  )
);

type GifProps = {
  type: "waiting" | "searching";
};

const Gif = React.memo(({ type }: GifProps) => (
  <FastImage
    style={{
      alignSelf: "center",
      marginVertical: 20,
      height: 200,
      width: 300,
    }}
    resizeMode="contain"
    source={{ uri: type === "waiting" ? getWaitingGif() : getSearchingGif() }}
  />
));

export default WaitingRoom;
