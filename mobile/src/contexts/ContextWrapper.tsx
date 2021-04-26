import { ThemeContextProvider } from "./ThemeContext";
import React from "react";
import { BadgeContextProvider } from "./BadgeContext";
import { CallContextProvider } from "./CallContext";
import { SocketContextProvider } from "./SocketContext";
import { GlobalContextProvider } from "./GlobalContext";
import { StreamContextProvider } from "./StreamContext";
import { ConversationContextProvider } from "./ConversationContext";

const ContextWrapper = (props: { children: React.ReactNode }) => {
  return (
    <ThemeContextProvider>
      <GlobalContextProvider>
        <SocketContextProvider>
          <BadgeContextProvider>
            <CallContextProvider>
              <StreamContextProvider>
                <ConversationContextProvider>
                  {props.children}
                </ConversationContextProvider>
              </StreamContextProvider>
            </CallContextProvider>
          </BadgeContextProvider>
        </SocketContextProvider>
      </GlobalContextProvider>
    </ThemeContextProvider>
  );
};

export default ContextWrapper;
