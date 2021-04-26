import React, { useEffect, useState, useContext } from "react";
import {
  BadgeStatus,
  BadgeStatusKeys,
  amplitudeTrack,
  AMPLITUDE_TRANSACTIONAL_EVENTS,
} from "../utils";
import { SocketContext } from "./SocketContext";

type SetBadgeStatusState = (value: React.SetStateAction<BadgeStatus>) => void;
type IncrementOrDecrementBadgeStateProperty = (
  propertyName: BadgeStatusKeys
) => void;

export type ContextProps = {
  badgeStatusState: State;
  setBadgeStatusState: SetBadgeStatusState;
  incrementBadgeStateProperty: IncrementOrDecrementBadgeStateProperty;
  decrementBadgeStateProperty: IncrementOrDecrementBadgeStateProperty;
};

type UpdateActivityBadge = (data: { count: number }) => void;

type EmitEvents = keyof typeof EmitEventsEnum;

enum EmitEventsEnum {
  get_unread_activity_count = "get_unread_activity_count",
}

type Props = { children: React.ReactNode };

type State = BadgeStatus;

const initialState: State = {
  conversations: 0,
  activity: 0,
};

const BadgeContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

const BadgeContextProvider = (props: Props) => {
  const [badgeStatusState, setBadgeStatusState] = useState(initialState);
  const socketContext = useContext(SocketContext);

  const emit = (event: any, ...args: any[]) => {
    socketContext.socket?.emit(event, ...args);
  };

  const socketEmitStatusCb = (
    event: EmitEvents,
    successCb: (dataCb?: any) => any
  ) => (status: "ok" | "error", data?: any) => {
    if (status === "error") {
      amplitudeTrack(AMPLITUDE_TRANSACTIONAL_EVENTS.activity_error, {
        event,
        description: "server_error",
      });
    }
    if (status === "ok") {
      successCb(data);
    }
  };

  useEffect(() => {
    socketContext.turnOnActivityListener(
      "unread_activity_count",
      updateActivityBadge
    );
    emit(
      "get_unread_activity_count",
      socketEmitStatusCb("get_unread_activity_count", updateActivityBadge)
    );
    return () => {
      socketContext.turnOffActivityListener(
        "unread_activity_count",
        updateActivityBadge
      );
    };
  }, [socketContext.state.socket]);

  const updateActivityBadge: UpdateActivityBadge = ({ count }) => {
    setBadgeStatusState((prevState) => ({ ...prevState, activity: count }));
  };

  const incrementBadgeStateProperty: IncrementOrDecrementBadgeStateProperty = (
    propertyName
  ) => {
    setBadgeStatusState((prevState) => ({
      ...prevState,
      [propertyName]: prevState[propertyName] + 1,
    }));
  };

  const decrementBadgeStateProperty: IncrementOrDecrementBadgeStateProperty = (
    propertyName
  ) => {
    setBadgeStatusState((prevState) => ({
      ...prevState,
      [propertyName]:
        prevState[propertyName] !== 0 ? prevState[propertyName] - 1 : 0,
    }));
  };

  return (
    <BadgeContext.Provider
      value={{
        badgeStatusState,
        setBadgeStatusState,
        incrementBadgeStateProperty,
        decrementBadgeStateProperty,
      }}
    >
      {props.children}
    </BadgeContext.Provider>
  );
};

export { BadgeContext, BadgeContextProvider };
