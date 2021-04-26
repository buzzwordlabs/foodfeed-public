import React, { useEffect, useState } from "react";
import ENV from "../../env";
import io from "socket.io-client";
import { readCache, sessionId, bugsnagBreadcrumb, Callback } from "../utils";
import {
  StreamEventListenersEnum,
  CallEventListenersEnum,
  SocketEventListenersEnum,
  ConversationEventListenersEnum,
  ActivityEventListenersEnum,
} from "./events";
import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";

type TurnOnSocketListener = (
  event: keyof typeof SocketEventListenersEnum,
  cb: Callback
) => void;
type TurnOffSocketListener = (
  event: keyof typeof SocketEventListenersEnum,
  cb?: Callback
) => void;

type TurnOnStreamListener = (
  event: keyof typeof StreamEventListenersEnum,
  cb: Callback
) => void;
type TurnOffStreamListener = (
  event: keyof typeof StreamEventListenersEnum,
  cb?: Callback
) => void;

type TurnOnCallListener = (
  event: keyof typeof CallEventListenersEnum,
  cb: Callback
) => void;
type TurnOffCallListener = (
  event: keyof typeof CallEventListenersEnum,
  cb?: Callback
) => void;

type TurnOnConversationListener = (
  event: keyof typeof ConversationEventListenersEnum,
  cb: Callback
) => void;
type TurnOffConversationListener = (
  event: keyof typeof ConversationEventListenersEnum,
  cb?: Callback
) => void;

type TurnOnActivityListener = (
  event: keyof typeof ActivityEventListenersEnum,
  cb: Callback
) => void;
type TurnOffActivityListener = (
  event: keyof typeof ActivityEventListenersEnum,
  cb?: Callback
) => void;

type ContextProps = {
  state: State;
  startSocket: () => void;
  killSocket: () => void;
  socket: SocketIOClient.Socket;
  turnOnStreamListener: TurnOnStreamListener;
  turnOffStreamListener: TurnOffStreamListener;
  turnOnCallListener: TurnOnCallListener;
  turnOffCallListener: TurnOffCallListener;
  turnOnConversationListener: TurnOnConversationListener;
  turnOffConversationListener: TurnOffConversationListener;
  turnOnActivityListener: TurnOnActivityListener;
  turnOffActivityListener: TurnOffActivityListener;
};

const SocketContext = React.createContext<ContextProps>(
  (null as unknown) as ContextProps
);

interface State {
  socket: SocketIOClient.Socket;
  authenticated: boolean;
}

interface Props {
  children: React.ReactNode;
}

const SocketContextProvider = (props: Props) => {
  const [state, setState] = useState({
    socket: (null as unknown) as SocketIOClient.Socket,
    authenticated: false,
  });

  let prevNetworkType: keyof typeof NetInfoStateType;

  useEffect(() => {
    if (state.authenticated) {
      const unsubscribe = NetInfo.addEventListener(
        ({ type, isInternetReachable }) => {
          if (isInternetReachable) {
            if (type === "cellular" && prevNetworkType === "wifi") {
              state.socket.io.opts.query = {
                deviceId: sessionId,
                networkSwitch: true,
              };
              prevNetworkType = type;
            } else if (prevNetworkType === "cellular" && type === "wifi") {
              state.socket.io.opts.query = {
                deviceId: sessionId,
                networkSwitch: true,
              };
              prevNetworkType = type;
            } else if (type === "none") {
              state.socket.io.opts.query = {
                deviceId: sessionId,
                networkSwitch: true,
              };
            }
            if (!prevNetworkType) {
              prevNetworkType = type;
            }
            bugsnagBreadcrumb("network_switch", {
              newNetworkType: type,
              prevNetworkType,
            });
          }
        }
      );
      return unsubscribe;
    }
  }, [state.authenticated]);

  useEffect(() => {
    if (state.socket) {
      (async () => {
        const authToken = await readCache("authToken");
        state.socket.on("connect", () => {
          state.socket.emit("authenticate", { token: authToken }); //send the jwt
          turnOnSocketListener(
            SocketEventListenersEnum.authenticated,
            authenticatedHandler
          );
          turnOnSocketListener(
            SocketEventListenersEnum.unauthorized,
            unauthorizedHandler
          );
        });
        state.socket.on("disconnect", () => {
          turnOffSocketListener("authenticated", authenticatedHandler);
          turnOffSocketListener("unauthorized", unauthorizedHandler);
        });
      })();
    }
  }, [state.socket]);

  const authenticatedHandler = () => {
    setState({ ...state, authenticated: true });
    state.socket.io.opts.query = { deviceId: sessionId, networkSwitch: false };
  };

  const unauthorizedHandler = (msg: any) =>
    bugsnagBreadcrumb("unauthorized", JSON.stringify(msg));

  const startSocket = () => {
    if (!state.socket) {
      const socket = io.connect(ENV.API_BASE_URL, {
        transports: ["websocket"],
        jsonp: false,
        query: { deviceId: sessionId, networkSwitch: false },
      });
      setState({ ...state, socket });
    }
  };

  const killSocket = () => {
    state.socket.close();
    setState({ ...state, socket: (null as unknown) as SocketIOClient.Socket });
  };

  const turnOnSocketListener: TurnOnSocketListener = (event, cb) => {
    state.socket?.on(event, cb);
  };

  const turnOffSocketListener: TurnOffSocketListener = (event, cb) => {
    state.socket?.off(event, cb);
  };

  const turnOnStreamListener: TurnOnStreamListener = (event, cb) => {
    state.socket?.on(event, cb);
  };

  const turnOffStreamListener: TurnOffStreamListener = (event, cb) => {
    state.socket?.off(event, cb);
  };

  const turnOnCallListener: TurnOnCallListener = (event, cb) => {
    state.socket?.on(event, cb);
  };

  const turnOffCallListener: TurnOffCallListener = (event, cb) => {
    state.socket?.off(event, cb);
  };

  const turnOnConversationListener: TurnOnConversationListener = (
    event,
    cb
  ) => {
    state.socket?.on(event, cb);
  };

  const turnOffConversationListener: TurnOffConversationListener = (
    event,
    cb
  ) => {
    state.socket?.off(event, cb);
  };

  const turnOnActivityListener: TurnOnActivityListener = (event, cb) => {
    state.socket?.on(event, cb);
  };

  const turnOffActivityListener: TurnOffActivityListener = (event, cb) => {
    state.socket?.off(event, cb);
  };

  return (
    <SocketContext.Provider
      value={{
        state: state,
        startSocket,
        killSocket,
        socket: state.socket,
        turnOffStreamListener,
        turnOnStreamListener,
        turnOffCallListener,
        turnOnCallListener,
        turnOnConversationListener,
        turnOffConversationListener,
        turnOnActivityListener,
        turnOffActivityListener,
      }}
    >
      {props.children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketContextProvider };
