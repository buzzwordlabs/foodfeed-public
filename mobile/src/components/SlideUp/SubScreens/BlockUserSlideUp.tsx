import React, { forwardRef } from "react";

import Button from "../../Primitives/Button";
import { Modalize } from "react-native-modalize";
import SlideUp from "../SlideUp";
import Text from "../../Primitives/Text";
import { View } from "react-native";
import { errorColor } from "../../../constants";
import { useRequest } from "../../../hooks";
import { debounce } from "lodash";
import { showBanner } from "../../../utils";

export type Props = {
  username: string;
  /**
   * Will run if user presses cancel button
   */
  onCancel: () => any | Promise<any>;
  /**
   * Will run right before slide up closes (don't pass function to close slide up)
   */
  onClose?: () => any | Promise<any>;
  /**
   * Will run if response is not ok
   */
  onSuccess?: (username: string) => any | Promise<any>;
  /**
   * Will run if response is not ok
   */
  onFail?: (username: string) => any | Promise<any>;
  /**
   * Will run whether response is ok or not
   */
  onSubmit?: () => any | Promise<any>;
  ref: React.Ref<Modalize>;
};

const BlockUserSlideUp: React.FC<Props> = forwardRef(
  (props: Props, ref: React.Ref<Modalize>) => {
    const {
      onSubmit = () => {},
      onClose = () => {},
      onSuccess = () => {},
      onFail = () => {},
      onCancel,
      username,
    } = props;
    const [request] = useRequest();

    const submit = debounce(async () => {
      await onSubmit();
      const response = await request({
        url: "/user/tattle/block",
        method: "POST",
        body: { username },
      });
      if (response.ok) {
        await onSuccess(username);
        showBanner({ message: `${username} has been blocked` });
      } else {
        await onFail(username);
        showBanner({ message: `An error has occurred.` });
      }
    }, 500);

    return (
      <SlideUp
        ref={ref}
        justifyContentCenter
        adjustToContentHeight={false}
        onClose={onClose}
      >
        <View style={{ alignItems: "center" }}>
          <View>
            <Text
              a="center"
              s="subHeader"
              w="bold"
              style={{ marginBottom: 30 }}
            >
              Block {username} 🛑
            </Text>
          </View>
          <View style={{ alignSelf: "center" }}>
            <Text w="semiBold" s="lg" linebreak>
              Are you sure you'd like to block {username || "this person"}?
            </Text>
            <Text w="semiBold" s="lg">
              You can always edit your blocked list under your account settings.
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: 30,
            }}
          >
            <Button
              style={{ flex: 1, marginHorizontal: 10 }}
              title="Cancel"
              outline
              onPress={onCancel}
            />
            <Button
              style={{
                flex: 1,
                marginHorizontal: 10,
                backgroundColor: errorColor,
              }}
              title="Block"
              onPress={submit}
            />
          </View>
        </View>
      </SlideUp>
    );
  }
);

export default BlockUserSlideUp;
